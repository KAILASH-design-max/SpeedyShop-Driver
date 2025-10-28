
"use client";

import { useEffect, useState, useRef } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { PackageCheck, Loader2, PackageSearch, PackagePlus, CheckCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { CustomerChatDialog } from "@/components/communication/CustomerChatDialog";
import { AvailableOrderCard } from "@/components/dashboard/AvailableOrderCard";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { createNotification } from "@/lib/notifications";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [customerChatOrder, setCustomerChatOrder] = useState<Order | null>(null);
  const notifiedOrderIds = useRef(new Set<string>());
  
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setActiveOrders([]);
        setAvailableOrders([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listener for NEW orders available to the driver
  useEffect(() => {
    if (!currentUser) {
        return;
    }
    const availableOrdersQuery = query(
        collection(db, "orders"),
        where("status", "==", "Placed")
    );

    const unsubscribe = onSnapshot(availableOrdersQuery, async (snapshot) => {
        const fetchedAvailableOrdersPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
        let fetchedAvailableOrders = await Promise.all(fetchedAvailableOrdersPromises);

        // Client-side filter to ensure driver has access, if the field exists.
        fetchedAvailableOrders = fetchedAvailableOrders.filter(order => 
            !order.accessibleTo || order.accessibleTo.length === 0 || order.accessibleTo.includes(currentUser.uid)
        );

        setAvailableOrders(fetchedAvailableOrders);

        // --- Create notifications for new orders ---
        fetchedAvailableOrders.forEach(order => {
            if (!notifiedOrderIds.current.has(order.id)) {
                createNotification(currentUser.uid, {
                    title: 'New Order Available',
                    message: `A new order worth ₹${order.estimatedEarnings.toFixed(2)} is available for you to accept.`,
                    link: `/orders/${order.id}`,
                });
                notifiedOrderIds.current.add(order.id);
            }
        });

        setIsLoading(false);

    }, (error) => {
      console.error("Error fetching available orders:", error);
      toast({ variant: "destructive", title: "Load Failed", description: "Could not check for new orders." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, toast]);


  // Listener for ACTIVE orders assigned to the driver
  useEffect(() => {
    if (!currentUser) {
        return;
    }
    const activeOrdersQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("status", "in", ["accepted", "arrived-at-store", "picked-up", "out-for-delivery", "arrived"])
    );
     const unsubscribe = onSnapshot(activeOrdersQuery, async (snapshot) => {
        const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
        const fetchedActiveOrders = await Promise.all(ordersDataPromises);
        
        setActiveOrders(fetchedActiveOrders.sort((a, b) => (a.completedAt?.seconds || 0) - (b.completedAt?.seconds || 0)));
     }, (error) => {
      console.error("Error fetching active orders:", error);
      toast({ variant: "destructive", title: "Load Failed", description: "Could not load your active orders." });
    });

     return () => unsubscribe();
  }, [currentUser, toast]);


  const handleOrderAccept = async (orderToAccept: Order) => {
    if (!currentUser) return;

    const orderRef = doc(db, "orders", orderToAccept.id);
    try {
      await updateDoc(orderRef, {
        deliveryPartnerId: currentUser.uid,
        status: "accepted",
        accessibleTo: [], 
      });
      
      toast({
            title: "Order Accepted!",
            description: "The order has been added to your active list.",
            className: "bg-green-500 text-white"
      });
    } catch (error) {
        console.error("Error accepting order:", error);
        toast({ variant: "destructive", title: "Acceptance Failed", description: "Could not accept the order."});
    }
  };
  
  const handleCustomerChatOpen = (order: Order) => {
    setCustomerChatOrder(order);
  };
  
  return (
    <div className="p-6 space-y-6">

      {customerChatOrder && (
        <CustomerChatDialog
          order={customerChatOrder}
          open={!!customerChatOrder}
          onOpenChange={(isOpen) => !isOpen && setCustomerChatOrder(null)}
        />
      )}

      {/* Available Orders Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary flex items-center">
            <PackagePlus className="mr-2 h-6 w-6" />
            Available Orders
        </h2>
         {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
         ) : availableOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableOrders.map((order) => (
                <AvailableOrderCard 
                  key={order.id} 
                  order={order} 
                  onAccept={handleOrderAccept}
                />
              ))}
            </div>
         ) : (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground border-border">
                <p className="font-semibold text-lg">No new orders available right now.</p>
                <p className="text-sm mt-1">Check back soon!</p>
            </div>
         )}
      </div>

      <Separator />
      
      {/* Active Orders Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary flex items-center">
            <PackageCheck className="mr-2 h-6 w-6" />
            Your Active Orders
        </h2>
        {isLoading && activeOrders.length === 0 ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onCustomerChat={handleCustomerChatOpen}
                />
            ))}
            </div>
        ) : (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground border-border">
              <PackageSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="font-semibold text-lg">You have no active orders.</p>
              <p className="text-sm mt-1">Accept an order from the 'Available Orders' section to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
}

    

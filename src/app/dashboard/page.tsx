
"use client";

import { useEffect, useState, useRef } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { PackageCheck, Loader2, PackageSearch } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { CustomerChatDialog } from "@/components/communication/CustomerChatDialog";
import { NewOrderCard } from "@/components/dashboard/NewOrderCard";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [customerChatOrder, setCustomerChatOrder] = useState<Order | null>(null);
  
  const { toast } = useToast();
  const seenOrderIds = useRef(new Set<string>());

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setActiveOrders([]);
        setNewOrder(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Unified listener for both new and active orders
  useEffect(() => {
    if (!currentUser) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    // This query is complex and may require a composite index in Firestore.
    // The query looks for orders where the user is either the assigned partner OR is in the pool of potential partners.
    const ordersQuery = query(
      collection(db, "orders"),
      where("orderStatus", "in", ["Placed", "accepted", "arrived-at-store", "picked-up", "out-for-delivery", "arrived"])
    );

    const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
      const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
      let allRelevantOrders = await Promise.all(ordersDataPromises);
      
      // Client-side filtering
      allRelevantOrders = allRelevantOrders.filter(order => 
        order.deliveryPartnerId === currentUser.uid || (order.accessibleTo && order.accessibleTo.includes(currentUser.uid))
      );

      const newActiveOrders: Order[] = [];
      const availableOrders: Order[] = [];
      
      for (const order of allRelevantOrders) {
        if (order.orderStatus === 'Placed' && !seenOrderIds.current.has(order.id)) {
            availableOrders.push(order);
        } else if (order.orderStatus !== 'Placed' && order.deliveryPartnerId === currentUser.uid) {
            newActiveOrders.push(order);
        }
      }

      setActiveOrders(newActiveOrders.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0)));
      setNewOrder(availableOrders.length > 0 ? availableOrders[0] : null);
      setIsLoading(false);

    }, (error) => {
      console.error("Error fetching all orders:", error);
      toast({ variant: "destructive", title: "Load Failed", description: "Could not load orders. You may need to create a composite index in Firestore." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, toast]);


  const handleOrderAccept = async (orderToAccept: Order) => {
    if (!currentUser) return;

    const orderRef = doc(db, "orders", orderToAccept.id);
    try {
      await updateDoc(orderRef, {
        deliveryPartnerId: currentUser.uid,
        orderStatus: "accepted",
        accessibleTo: [], // Clear the accessibleTo field after acceptance
      });
      
      setNewOrder(null);
      seenOrderIds.current.add(orderToAccept.id);
    
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
  
  const handleNewOrderDismiss = async (orderToDismiss: Order) => {
    if (currentUser) {
      seenOrderIds.current.add(orderToDismiss.id);
      setNewOrder(null);
      
      const orderRef = doc(db, "orders", orderToDismiss.id);
      try {
        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) return;

        const currentOrderDoc = await mapFirestoreDocToOrder(orderDoc);
        const updatedAccessibleTo = (currentOrderDoc.accessibleTo || []).filter(uid => uid !== currentUser.uid);

        await updateDoc(orderRef, {
          accessibleTo: updatedAccessibleTo
        });
      } catch (error) {
        console.error("Error dismissing order:", error);
      }
    }
  }


  return (
    <div className="p-6 space-y-6">

      {newOrder && (
        <NewOrderCard 
          order={newOrder}
          onDismiss={() => handleNewOrderDismiss(newOrder)}
          onAccept={handleOrderAccept}
        />
      )}

      {customerChatOrder && (
        <CustomerChatDialog
          order={customerChatOrder}
          open={!!customerChatOrder}
          onOpenChange={(isOpen) => !isOpen && setCustomerChatOrder(null)}
        />
      )}
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-primary flex items-center">
            <PackageCheck className="mr-2 h-6 w-6" />
            Active Orders
        </h2>
        {isLoading ? (
            <div className="flex justify-center items-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading orders...</p>
            </div>
        ) : activeOrders.length > 0 ? (
            <div className="flex flex-col gap-4">
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
              <p className="text-sm mt-1">Go online to see new delivery requests as they come in.</p>
            </div>
        )}
      </div>
    </div>
  );
}

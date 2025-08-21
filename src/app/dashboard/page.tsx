
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

  // Listener for NEW orders available to the driver
  useEffect(() => {
    if (!currentUser) {
        return;
    }
    // Simplified query to avoid needing a composite index. Filtering for "Placed" status happens on the client.
    const availableOrdersQuery = query(
        collection(db, "orders"),
        where("accessibleTo", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(availableOrdersQuery, async (snapshot) => {
        const availableOrdersPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
        let availableOrders = await Promise.all(availableOrdersPromises);

        // Filter for "Placed" orders on the client, ignoring case and whitespace
        availableOrders = availableOrders.filter(order => order.orderStatus.trim().toLowerCase() === 'placed');

        if (availableOrders.length > 0) {
            // Find the first order that hasn't been seen/dismissed in this session
            const orderToShow = availableOrders.find(o => !seenOrderIds.current.has(o.id));
            setNewOrder(orderToShow || null);
        } else {
            setNewOrder(null);
        }
        // Set loading to false here as well, in case this listener runs but finds no 'Placed' orders.
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
        setIsLoading(false);
        return;
    }
    const activeOrdersQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("orderStatus", "in", ["accepted", "arrived-at-store", "picked-up", "out-for-delivery", "arrived"])
    );
     const unsubscribe = onSnapshot(activeOrdersQuery, async (snapshot) => {
        const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
        const fetchedActiveOrders = await Promise.all(ordersDataPromises);
        
        setActiveOrders(fetchedActiveOrders.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0)));
        setIsLoading(false);
     }, (error) => {
      console.error("Error fetching active orders:", error);
      toast({ variant: "destructive", title: "Load Failed", description: "Could not load your active orders." });
      setIsLoading(false);
    });

     return () => unsubscribe();
  }, [currentUser, toast]);


  const handleOrderAccept = async (orderToAccept: Order) => {
    if (!currentUser) return;

    // Optimistically update the UI to avoid race conditions
    setNewOrder(null);
    seenOrderIds.current.add(orderToAccept.id);

    const orderRef = doc(db, "orders", orderToAccept.id);
    try {
      await updateDoc(orderRef, {
        deliveryPartnerId: currentUser.uid,
        orderStatus: "accepted",
        accessibleTo: [], // Clear the accessibleTo field after acceptance
      });
      
      toast({
            title: "Order Accepted!",
            description: "The order has been added to your active list.",
            className: "bg-green-500 text-white"
      });
    } catch (error) {
        console.error("Error accepting order:", error);
        toast({ variant: "destructive", title: "Acceptance Failed", description: "Could not accept the order."});
        // If the update fails, we may need to handle reversing the UI change,
        // but the listener should eventually correct the state.
    }
  };
  
  const handleCustomerChatOpen = (order: Order) => {
    setCustomerChatOrder(order);
  };
  
  const handleNewOrderDismiss = (orderToDismiss: Order) => {
    if (currentUser) {
      seenOrderIds.current.add(orderToDismiss.id);
      setNewOrder(null);
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

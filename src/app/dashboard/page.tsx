
"use client";

import { useEffect, useState, useRef } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { PackageCheck, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { CustomerChatDialog } from "@/components/communication/CustomerChatDialog";
import { NewOrderCard } from "@/components/dashboard/NewOrderCard";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [newOrder, setNewOrder] = useState<Order | null>(null);

  const [customerChatOrder, setCustomerChatOrder] = useState<Order | null>(null);
  
  const { toast } = useToast();
  const previousOrderIds = useRef(new Set());

  useEffect(() => {
    // Load active orders from cache on initial render
    try {
      const cachedActiveOrders = localStorage.getItem('activeOrdersCache');
      if (cachedActiveOrders) {
        setActiveOrders(JSON.parse(cachedActiveOrders));
      }
    } catch (error) {
      console.error("Failed to load cached active orders:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setActiveOrders([]);
        setLoadingActive(false);
        setNewOrder(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listener for NEW unassigned orders available to the current user
  useEffect(() => {
    if (!currentUser) {
        setNewOrder(null);
        return;
    };

    const newOrdersQuery = query(
      collection(db, "orders"),
      where("orderStatus", "==", "Placed"),
      where("accessibleTo", "array-contains", currentUser.uid)
    );

    const unsubscribeNew = onSnapshot(newOrdersQuery, async (snapshot) => {
        if (!snapshot.empty) {
            const doc = snapshot.docs[0]; // Show the first available order
            const order = await mapFirestoreDocToOrder(doc);
            // Only show if it's not already an active order and not the current new order
            if (!activeOrders.some(o => o.id === order.id) && newOrder?.id !== order.id) {
               setNewOrder(order);
            }
        } else {
           setNewOrder(null);
        }
    }, (error) => {
        console.error("Error fetching new available orders:", error);
    });
    
    return () => unsubscribeNew();

  }, [currentUser, activeOrders, newOrder]);


  // Listener for ACTIVE orders assigned to the current user
  useEffect(() => {
    if (!currentUser) {
      setActiveOrders([]);
      setLoadingActive(false);
      return;
    }

    setLoadingActive(true);
    const activeOrdersQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("orderStatus", "in", ["accepted", "arrived-at-store", "picked-up", "out-for-delivery", "arrived"])
    );

    const unsubscribeActive = onSnapshot(activeOrdersQuery, async (snapshot) => {
      const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
      const newOrdersData = await Promise.all(ordersDataPromises);
      setActiveOrders(newOrdersData);
      setLoadingActive(false);

      try {
        localStorage.setItem('activeOrdersCache', JSON.stringify(newOrdersData));
      } catch (error) {
        console.error("Failed to cache active orders:", error);
      }
    }, (error) => {
      console.error("Error fetching active orders:", error);
      setLoadingActive(false);
    });

    return () => unsubscribeActive();
  }, [currentUser, toast]);

  const handleOrderAccept = async (orderToAccept: Order) => {
      if (!currentUser) return;
      setNewOrder(null); // Dismiss the card immediately

      // Optimistically add to active orders to prevent flash of "no orders"
      if (!activeOrders.some(o => o.id === orderToAccept.id)) {
        setActiveOrders(prev => [...prev, { ...orderToAccept, orderStatus: 'accepted' }]);
      }
      
      const orderRef = doc(db, "orders", orderToAccept.id);
      
      try {
        await updateDoc(orderRef, {
            deliveryPartnerId: currentUser.uid,
            orderStatus: "accepted",
            accessibleTo: [], // Clear accessibility list
        });
        
        toast({
            title: "Order Accepted!",
            description: "The order has been added to your active list.",
            className: "bg-green-500 text-white"
        });

      } catch (error) {
          console.error("Error accepting order:", error);
          toast({ variant: "destructive", title: "Acceptance Failed", description: "Could not accept the order."});
          // Revert optimistic update
          setActiveOrders(prev => prev.filter(o => o.id !== orderToAccept.id));
      }
  };
  
  const handleCustomerChatOpen = (order: Order) => {
    setCustomerChatOrder(order);
  };
  
  const handleNewOrderDismiss = () => {
    setNewOrder(null);
  }

  const isLoading = loadingActive;

  return (
    <div className="p-6 space-y-6">

      {newOrder && (
        <NewOrderCard 
          order={newOrder}
          onDismiss={handleNewOrderDismiss}
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
        {isLoading && activeOrders.length === 0 ? (
            <div className="flex justify-center items-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading active orders...</p>
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
              <p className="font-semibold">You have no active orders.</p>
              <p className="text-sm mt-1">Go online to see new delivery requests.</p>
            </div>
        )}
      </div>
    </div>
  );
}

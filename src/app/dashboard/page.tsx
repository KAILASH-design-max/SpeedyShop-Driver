
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
  const [loading, setLoading] = useState(true);
  const [newOrder, setNewOrder] = useState<Order | null>(null);

  const [customerChatOrder, setCustomerChatOrder] = useState<Order | null>(null);
  
  const { toast } = useToast();
  const seenOrderIds = useRef(new Set());

  useEffect(() => {
    // Load active orders from cache on initial render
    try {
      const cachedActiveOrders = localStorage.getItem('activeOrdersCache');
      if (cachedActiveOrders) {
        const parsedOrders = JSON.parse(cachedActiveOrders);
        setActiveOrders(parsedOrders);
        parsedOrders.forEach((o: Order) => seenOrderIds.current.add(o.id));
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
        setLoading(false);
        setNewOrder(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);


  // Combined listener for both active orders and detecting newly assigned orders
  useEffect(() => {
    if (!currentUser) {
      setActiveOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const activeOrdersQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("orderStatus", "in", ["accepted", "arrived-at-store", "picked-up", "out-for-delivery", "arrived"])
    );

    const unsubscribeActive = onSnapshot(activeOrdersQuery, async (snapshot) => {
      const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
      const newOrdersData = await Promise.all(ordersDataPromises);
      
      // Detect if a new order was just assigned
      const justAssignedOrder = newOrdersData.find(order => 
        order.orderStatus === 'accepted' && !seenOrderIds.current.has(order.id)
      );
      
      if (justAssignedOrder) {
        setNewOrder(justAssignedOrder);
      }

      // Update the set of seen orders
      newOrdersData.forEach(order => seenOrderIds.current.add(order.id));
      
      setActiveOrders(newOrdersData);
      setLoading(false);

      try {
        localStorage.setItem('activeOrdersCache', JSON.stringify(newOrdersData));
      } catch (error) {
        console.error("Failed to cache active orders:", error);
      }
    }, (error) => {
      console.error("Error fetching active orders:", error);
      // Don't show permission denied errors if they happen.
      if (error.code !== 'permission-denied') {
        toast({ variant: "destructive", title: "Load Failed", description: "Could not load active orders."});
      }
      setLoading(false);
    });

    return () => unsubscribeActive();
  }, [currentUser, toast]);

  const handleOrderAccept = async (orderToAccept: Order) => {
      if (!currentUser) return;
      setNewOrder(null); // Dismiss the card immediately

      // Optimistically add to active orders if it's not already there.
      if (!activeOrders.some(o => o.id === orderToAccept.id)) {
        setActiveOrders(prev => [...prev, { ...orderToAccept, orderStatus: 'accepted' }]);
      }
      
      // Note: The original logic for accepting an order would be triggered
      // by a backend function or another user action. For this UI, we assume
      // the assignment has happened, and this is just acknowledging it.
      // If the driver needs to explicitly accept, the logic would be different.
      // For now, we just ensure the UI is in a consistent state.
      toast({
            title: "Order Accepted!",
            description: "The order has been added to your active list.",
            className: "bg-green-500 text-white"
      });
  };
  
  const handleCustomerChatOpen = (order: Order) => {
    setCustomerChatOrder(order);
  };
  
  const handleNewOrderDismiss = () => {
    if (newOrder) {
      // If dismissed, make sure we don't show it again for this session
      seenOrderIds.current.add(newOrder.id);
    }
    setNewOrder(null);
  }

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
        {loading && activeOrders.length === 0 ? (
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

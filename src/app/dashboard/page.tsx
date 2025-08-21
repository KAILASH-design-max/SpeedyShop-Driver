
"use client";

import { useEffect, useState, useRef } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { PackageCheck, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { CustomerChatDialog } from "@/components/communication/CustomerChatDialog";
import { NewOrderCard } from "@/components/dashboard/NewOrderCard";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [newlyAssignedOrder, setNewlyAssignedOrder] = useState<Order | null>(null);

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
      }
    });
    return () => unsubscribeAuth();
  }, []);

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
      
      // Check for a new order that wasn't in the previous list
      const brandNewOrder = newOrdersData.find(order => 
          !previousOrderIds.current.has(order.id) && order.orderStatus === 'accepted'
      );

      if (brandNewOrder) {
          setNewlyAssignedOrder(brandNewOrder);
      }

      setActiveOrders(newOrdersData);
      
      // Update the set of previous order IDs
      previousOrderIds.current = new Set(newOrdersData.map(o => o.id));

      setLoadingActive(false);
      try {
        localStorage.setItem('activeOrdersCache', JSON.stringify(newOrdersData));
      } catch (error) {
        console.error("Failed to cache active orders:", error);
      }
    }, (error) => {
      console.error("Error fetching active orders:", error);
      if (error.code === 'permission-denied') {
          toast({
              variant: "destructive",
              title: "Permission Error",
              description: "You do not have permission to view active orders. Please contact support."
          });
      }
      setLoadingActive(false);
    });

    return () => unsubscribeActive();
  }, [currentUser, toast]);
  
  const handleCustomerChatOpen = (order: Order) => {
    setCustomerChatOrder(order);
  };
  
  const handleNewOrderDismiss = () => {
    setNewlyAssignedOrder(null);
  }

  const isLoading = loadingActive;

  return (
    <div className="p-6 space-y-6">

      {newlyAssignedOrder && (
        <NewOrderCard 
          order={newlyAssignedOrder}
          onDismiss={handleNewOrderDismiss}
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


"use client";

import { useEffect, useState } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { PackageCheck, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, limit } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { CustomerChatDialog } from "@/components/communication/CustomerChatDialog";
import { NewOrderCard } from "@/components/dashboard/NewOrderCard";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const [ignoredOrderId, setIgnoredOrderId] = useState<string | null>(null);

  const [customerChatOrder, setCustomerChatOrder] = useState<Order | null>(null);
  
  const { toast } = useToast();

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

  // Listener for ACTIVE orders
  useEffect(() => {
    if (!currentUser) {
      setActiveOrders([]);
      setLoadingActive(false);
      return () => {};
    }

    setLoadingActive(true);
    const activeOrdersQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("orderStatus", "not-in", ["delivered", "cancelled"])
    );

    const unsubscribeActive = onSnapshot(activeOrdersQuery, async (snapshot) => {
      const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
      const ordersData = await Promise.all(ordersDataPromises);
      setActiveOrders(ordersData);
      setLoadingActive(false);
      try {
        localStorage.setItem('activeOrdersCache', JSON.stringify(ordersData));
      } catch (error) {
        console.error("Failed to cache active orders:", error);
      }
    }, (error) => {
      console.error("Error fetching active orders:", error);
      setLoadingActive(false);
    });

    return () => unsubscribeActive();
  }, [currentUser, toast]);

  // Listener for NEW unassigned orders
  useEffect(() => {
    if (!currentUser) return;
    
    // This logic relies on the availability status from the AuthenticatedLayout now.
    // For this to work seamlessly, we'd ideally use a global state manager (like Context or Zustand).
    // For now, we'll assume the status check happens at a higher level and this just listens.
    // A slight delay might occur if the status isn't propagated instantly.
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().availabilityStatus === 'online') {
            const newOrdersQuery = query(
              collection(db, "orders"),
              where("deliveryPartnerId", "==", null),
              where("orderStatus", "==", "Placed"),
              limit(1)
            );

            const unsubscribeNew = onSnapshot(newOrdersQuery, async (snapshot) => {
              if (!snapshot.empty) {
                const orderDoc = snapshot.docs[0];
                if (orderDoc.id === ignoredOrderId) {
                    return;
                }

                const mappedOrder = await mapFirestoreDocToOrder(orderDoc);
                setNewOrder(mappedOrder);
              } else {
                setNewOrder(null);
              }
            }, (error) => {
              if (error.code !== 'permission-denied') {
                console.error("Error fetching new orders:", error);
              }
            });
            return () => unsubscribeNew();
        } else {
             if(newOrder) setNewOrder(null);
        }
    });


    return () => unsubscribeProfile();

  }, [currentUser, ignoredOrderId, newOrder]);
  
  const handleCustomerChatOpen = (order: Order) => {
    setCustomerChatOrder(order);
  };

  const handleOrderAction = (orderId: string) => {
    setIgnoredOrderId(orderId);
    setNewOrder(null);
  }

  const isLoading = loadingActive;

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader />

      {newOrder && currentUser && (
        <NewOrderCard 
          order={newOrder} 
          currentUserId={currentUser.uid} 
          onOrderAction={() => handleOrderAction(newOrder.id)}
          onOrderAccept={(acceptedOrder) => {
            setActiveOrders(prevOrders => [acceptedOrder, ...prevOrders]);
          }}
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

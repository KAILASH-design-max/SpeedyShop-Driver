
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
  const [availabilityStatus, setAvailabilityStatus] = useState<Profile['availabilityStatus'] | undefined>(undefined);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
  
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
        setIsAvailabilityLoading(false);
        setAvailabilityStatus(undefined);
        setActiveOrders([]);
        setLoadingActive(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.uid);
      const unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
        setIsAvailabilityLoading(true);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as Profile;
          if (profileData.availabilityStatus === undefined) {
            await updateDoc(userDocRef, { availabilityStatus: 'offline' });
            setAvailabilityStatus('offline');
          } else {
            setAvailabilityStatus(profileData.availabilityStatus);
          }
        } else {
          setAvailabilityStatus('offline');
           await setDoc(userDocRef, { availabilityStatus: 'offline' }, { merge: true });
        }
        setIsAvailabilityLoading(false);
      }, (error) => {
        console.error("Error fetching user profile for availability:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load availability status." });
        setAvailabilityStatus('offline');
        setIsAvailabilityLoading(false);
      });
      return () => unsubscribeProfile();
    } else {
      setIsAvailabilityLoading(false);
      setAvailabilityStatus(undefined); 
    }
  }, [currentUser, toast]);


  const handleAvailabilityChange = async (newStatus: Required<Profile['availabilityStatus']>) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "Not logged in." });
      return;
    }
    setIsAvailabilityLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, { availabilityStatus: newStatus });
      setAvailabilityStatus(newStatus);
      toast({ title: "Status Updated", description: `You are now ${newStatus}.`, className: newStatus === 'online' ? "bg-green-500 text-white" : newStatus === 'on_break' ? "bg-yellow-500 text-black" : "" });
    } catch (error) {
      console.error("Error updating availability status:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update status." });
    } finally {
      setIsAvailabilityLoading(false);
    }
  };

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
    if (availabilityStatus !== 'online') {
      if(newOrder) setNewOrder(null); // Clear any stale new order if user goes offline
      return;
    }

    const newOrdersQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", null),
      where("orderStatus", "==", "Placed"),
      limit(1)
    );

    const unsubscribeNew = onSnapshot(newOrdersQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const orderDoc = snapshot.docs[0];
        // Do not show the order if it has been ignored in the current session.
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

  }, [availabilityStatus, ignoredOrderId]);
  
  const handleCustomerChatOpen = (order: Order) => {
    setCustomerChatOrder(order);
  };

  const handleOrderAction = (orderId: string) => {
    setIgnoredOrderId(orderId);
    setNewOrder(null);
  }

  const isLoading = isAvailabilityLoading || loadingActive;

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader 
        currentStatus={availabilityStatus}
        onStatusChange={handleAvailabilityChange}
        isLoading={isAvailabilityLoading}
      />

      {newOrder && currentUser && (
        <NewOrderCard 
          order={newOrder} 
          currentUserId={currentUser.uid} 
          onOrderAction={() => handleOrderAction(newOrder.id)}
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

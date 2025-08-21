
"use client";

import { useEffect, useState } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { PackageCheck, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, limit } from "firebase/firestore";
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
  const [ignoredOrderId, setIgnoredOrderId] = useState<string | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<Profile['availabilityStatus']>();


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

  useEffect(() => {
    if(currentUser) {
       const profileRef = doc(db, "users", currentUser.uid);
       const unsubscribe = onSnapshot(profileRef, (docSnap) => {
           if (docSnap.exists()) {
               const profileData = docSnap.data() as Profile;
               setAvailabilityStatus(profileData.availabilityStatus);
           }
       });
       return () => unsubscribe();
    }
  }, [currentUser]);

  // Listener for ACTIVE orders
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
  }, [currentUser]);

  // Listener for NEW unassigned orders
  useEffect(() => {
    if (availabilityStatus !== 'online' || !currentUser) {
        if(newOrder) setNewOrder(null);
        return;
    };
    
    const newOrdersQuery = query(
      collection(db, "orders"),
      where("orderStatus", "==", "Placed"),
      limit(10) // Fetch a few potential orders
    );

    const unsubscribeNew = onSnapshot(newOrdersQuery, async (snapshot) => {
      // Find the first document that does NOT have a deliveryPartnerId.
      const unassignedDoc = snapshot.docs.find(doc => !doc.data().deliveryPartnerId);

      if (unassignedDoc) {
        if (unassignedDoc.id === ignoredOrderId) {
            return;
        }
        const mappedOrder = await mapFirestoreDocToOrder(unassignedDoc);
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

  }, [availabilityStatus, currentUser, ignoredOrderId]);
  
  const handleCustomerChatOpen = (order: Order) => {
    setCustomerChatOrder(order);
  };

  const handleOrderAction = (orderId: string) => {
    setIgnoredOrderId(orderId);
    setNewOrder(null);
  }
  
  const handleOrderAccept = (acceptedOrder: Order) => {
     // Prevent adding duplicates. The real-time listener will also add the order.
     setActiveOrders(prevOrders => {
        if (prevOrders.some(o => o.id === acceptedOrder.id)) {
            return prevOrders;
        }
        return [acceptedOrder, ...prevOrders];
     });
     handleOrderAction(acceptedOrder.id);
  }

  const isLoading = loadingActive;

  return (
    <div className="p-6 space-y-6">

      {newOrder && currentUser && (
        <NewOrderCard 
          order={newOrder} 
          currentUserId={currentUser.uid} 
          onOrderAction={handleOrderAction}
          onOrderAccept={handleOrderAccept}
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

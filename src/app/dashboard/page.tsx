
"use client";

import { useEffect, useState } from "react";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { Separator } from "@/components/ui/separator";
import { PackageCheck, Loader2, BellDot } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { NewOrderCard } from "@/components/dashboard/NewOrderCard";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<Profile['availabilityStatus'] | undefined>(undefined);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
  
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);

  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [loadingNew, setLoadingNew] = useState(true);
  
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
        setNewOrders([]);
        setLoadingActive(false);
        setLoadingNew(false);
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
      where("orderStatus", "in", ["accepted", "picked-up", "out-for-delivery"])
    );

    const unsubscribeActive = onSnapshot(activeOrdersQuery, async (snapshot) => {
      const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
      const ordersData = await Promise.all(ordersDataPromises);
      setActiveOrders(ordersData);
      setLoadingActive(false);
      // Cache the fetched active orders
      try {
        localStorage.setItem('activeOrdersCache', JSON.stringify(ordersData));
      } catch (error) {
        console.error("Failed to cache active orders:", error);
      }
    }, (error) => {
      console.error("Error fetching active orders:", error);
       if (error.code !== 'permission-denied') {
          toast({ variant: "destructive", title: "Fetch Error", description: "Could not load active orders. Showing cached data if available." });
       }
      setLoadingActive(false);
    });

    return () => unsubscribeActive();
  }, [currentUser, toast]);

  // Listener for NEW orders
  useEffect(() => {
    if (!currentUser || availabilityStatus !== 'online') {
      setNewOrders([]);
      setLoadingNew(false);
      return () => {};
    }

    setLoadingNew(true);
    const newOrdersQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", null),
      where("orderStatus", "==", "Placed")
    );
    
    const unsubscribeNew = onSnapshot(newOrdersQuery, async (snapshot) => {
      const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
      const ordersData = await Promise.all(ordersDataPromises);
      setNewOrders(ordersData);
      setLoadingNew(false);
    }, (error) => {
      console.error("Error fetching new orders:", error);
       if (error.code !== 'permission-denied') {
          toast({ variant: "destructive", title: "Fetch Error", description: "Could not load new order alerts." });
       }
      setNewOrders([]);
      setLoadingNew(false);
    });
    
    return () => unsubscribeNew();

  }, [currentUser, availabilityStatus, toast]);

  const isLoading = isAvailabilityLoading || loadingActive || loadingNew;

  return (
    <div className="container mx-auto py-8">
      <DashboardHeader />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <AvailabilityToggle
            currentStatus={availabilityStatus}
            onStatusChange={handleAvailabilityChange}
            isLoading={isAvailabilityLoading}
          />

          <Separator />
          
           <div>
             <h2 className="text-2xl font-semibold mb-4 flex items-center text-primary">
              <BellDot className="mr-2 h-6 w-6" /> New Order Alerts
            </h2>
            {isLoading && newOrders.length === 0 ? (
               <div className="flex justify-center items-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : availabilityStatus !== 'online' ? (
                <p className="text-muted-foreground text-center p-4">Go online to see new order alerts.</p>
            ) : newOrders.length > 0 && currentUser ? (
              <div className="space-y-4">
                {newOrders.map(order => (
                  <NewOrderCard key={order.id} order={order} currentUserId={currentUser.uid} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center p-4">No new orders available right now. We'll notify you!</p>
            )}
          </div>

        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-primary">
            <PackageCheck className="mr-2 h-6 w-6" /> Your Active Orders
          </h2>
          {isLoading && activeOrders.length === 0 ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading...</p>
            </div>
          ) : activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center p-4">You have no active orders. Accept a new order to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
}

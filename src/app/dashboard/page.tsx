
"use client";

import { useEffect, useState } from "react";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, PackageCheck, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, DocumentData } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<Profile['availabilityStatus'] | undefined>(undefined);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingActive, setLoadingActive] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setIsAvailabilityLoading(false);
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
      toast({ title: "Status Updated", description: `You are now ${newStatus}.`, className: newStatus === 'online' ? "bg-green-500 text-white" : newStatus === 'on_break' ? "bg-yellow-500 text-black" : "" });
    } catch (error) {
      console.error("Error updating availability status:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update status." });
    }
  };


  useEffect(() => {
    if (!currentUser) {
      setNewOrders([]);
      setActiveOrders([]);
      setLoadingNew(false);
      setLoadingActive(false);
      return;
    }

    setLoadingNew(true);
    setLoadingActive(true);

    // Listener for new orders
    const newOrdersQuery = query(collection(db, "orders"), where("status", "==", "Placed"));
    const unsubscribeNew = onSnapshot(newOrdersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setNewOrders(ordersData);
      setLoadingNew(false);
    }, (error) => {
      console.error("Error fetching new orders:", error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not load new orders." });
      setLoadingNew(false);
    });

    // Listener for active orders (driver has accepted or is processing)
    const activeOrdersQuery = query(
      collection(db, "orders"), 
      where("status", "in", ["accepted", "picked-up", "out-for-delivery"]),
      // Potentially add: where("driverId", "==", currentUser.uid) if orders are assigned
    );
    const unsubscribeActive = onSnapshot(activeOrdersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setActiveOrders(ordersData);
      setLoadingActive(false);
    }, (error) => {
      console.error("Error fetching active orders:", error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not load active orders." });
      setLoadingActive(false);
    });

    return () => {
      unsubscribeNew();
      unsubscribeActive();
    };
  }, [currentUser, toast]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Driver Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <AvailabilityToggle
            currentStatus={availabilityStatus}
            onStatusChange={handleAvailabilityChange}
            isLoading={isAvailabilityLoading}
          />
        </div>

        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center text-destructive">
              <AlertCircle className="mr-2 h-6 w-6" /> New Order Alerts
            </h2>
            {loadingNew ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading new orders...</p>
              </div>
            ) : newOrders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {newOrders.map((order) => (
                  <OrderCard key={order.id} order={order} type="new" />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No new orders at the moment. You're all caught up!</p>
            )}
          </div>

          <Separator />

          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center text-primary">
              <PackageCheck className="mr-2 h-6 w-6" /> Active Orders
            </h2>
            {loadingActive ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="ml-2">Loading active orders...</p>
              </div>
            ) : activeOrders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} type="active" />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">You have no active orders.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

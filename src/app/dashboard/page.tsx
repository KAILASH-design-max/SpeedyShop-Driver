
"use client";

import { useEffect, useState } from "react";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, PackageCheck, Loader2, Info } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";

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
        setAvailabilityStatus(undefined);
        setNewOrders([]);
        setActiveOrders([]);
        setLoadingNew(false);
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
        if (error.code !== 'permission-denied') {
          toast({ variant: "destructive", title: "Error", description: "Could not load availability status." });
        }
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
      setAvailabilityStatus(newStatus); // Update local state immediately
      toast({ title: "Status Updated", description: `You are now ${newStatus}.`, className: newStatus === 'online' ? "bg-green-500 text-white" : newStatus === 'on_break' ? "bg-yellow-500 text-black" : "" });
    } catch (error) {
      console.error("Error updating availability status:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update status." });
    } finally {
      setIsAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || availabilityStatus !== 'online') {
      setNewOrders([]);
      setLoadingNew(false);
      return;
    }

    setLoadingNew(true);
    const newOrdersQuery = query(
      collection(db, "orders"),
      where("orderStatus", "==", "Placed"),
      where("deliveryPartnerId", "==", null)
    );

    const unsubscribeNew = onSnapshot(newOrdersQuery, async (snapshot) => {
      const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
      const ordersData = await Promise.all(ordersDataPromises);
      setNewOrders(ordersData);
      setLoadingNew(false);
    }, (error: any) => {
      console.error("Error fetching new orders:", error);
      if (error.code !== 'permission-denied') {
        toast({ variant: "destructive", title: "Fetch Error", description: "Could not load new orders." });
      }
      setNewOrders([]);
      setLoadingNew(false);
    });

    return () => unsubscribeNew();
  }, [currentUser, availabilityStatus, toast]);

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
      where("orderStatus", "in", ["accepted", "picked-up", "out-for-delivery"])
    );

    const unsubscribeActive = onSnapshot(activeOrdersQuery, async (snapshot) => {
      const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
      const ordersData = await Promise.all(ordersDataPromises);
      setActiveOrders(ordersData);
      setLoadingActive(false);
    }, (error: any) => {
      console.error("Error fetching active orders:", error);
      if (error.code !== 'permission-denied') {
        toast({ variant: "destructive", title: "Fetch Error", description: "Could not load active orders." });
      }
      setActiveOrders([]);
      setLoadingActive(false);
    });

    return () => unsubscribeActive();
  }, [currentUser, toast]);


  return (
    <div className="container mx-auto py-8">
      <DashboardHeader />
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
            {isAvailabilityLoading ? (
                 <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Checking availability...</p>
                 </div>
            ) : availabilityStatus === 'offline' ? (
              <div className="flex flex-col items-center justify-center p-4 text-center bg-muted rounded-lg">
                <Info className="h-10 w-10 text-primary mb-2" />
                <p className="font-semibold text-lg">You are currently offline.</p>
                <p className="text-muted-foreground">Go online using the toggle to start receiving new order alerts.</p>
              </div>
            ) : loadingNew ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading new orders...</p>
              </div>
            ) : newOrders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {newOrders.map((order) => (
                  <OrderCard key={order.id} order={order} type="new" currentUserId={currentUser?.uid} />
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

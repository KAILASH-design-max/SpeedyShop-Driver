
"use client";

import { useEffect, useState, useRef } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { PackageCheck, Loader2, PackageSearch, PackagePlus } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { CustomerChatDialog } from "@/components/communication/CustomerChatDialog";
import { AvailableOrderCard } from "@/components/dashboard/AvailableOrderCard";
import { Separator } from "@/components/ui/separator";
import { createNotification } from "@/lib/notifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EarningsForecast } from "@/components/dashboard/EarningsForecast";
import { Skeleton } from "@/components/ui/skeleton";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingAvailableOrders, setIsLoadingAvailableOrders] = useState(true);


  const [customerChatOrder, setCustomerChatOrder] = useState<Order | null>(null);
  const notifiedOrderIds = useRef(new Set<string>());

  const [availabilityStatus, setAvailabilityStatus] = useState<Profile['availabilityStatus'] | undefined>(undefined);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setActiveOrders([]);
        setAvailableOrders([]);
        setIsLoadingOrders(false);
        setIsLoadingAvailableOrders(false);
        setProfile(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
        const profileRef = doc(db, "users", currentUser.uid);
        const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
            setIsAvailabilityLoading(true);
            if (docSnap.exists()) {
                const profileData = docSnap.data() as Profile;
                setProfile(profileData);
                if (profileData.availabilityStatus === undefined) {
                    // Set default if not present
                    updateDoc(profileRef, { availabilityStatus: 'offline' });
                    setAvailabilityStatus('offline');
                } else {
                    setAvailabilityStatus(profileData.availabilityStatus);
                }
            } else {
                setProfile(null);
                setAvailabilityStatus('offline');
            }
            setIsAvailabilityLoading(false);
        });
        return () => unsubscribeProfile();
    } else {
       setIsAvailabilityLoading(false);
       setAvailabilityStatus(undefined);
    }
  }, [currentUser]);

  // Listener for NEW orders available to the driver
  useEffect(() => {
    if (!currentUser || availabilityStatus !== 'online') {
        if (!auth.currentUser) setIsLoadingAvailableOrders(false);
        setAvailableOrders([]);
        return;
    }
    
    setIsLoadingAvailableOrders(true);

    const availableOrdersQuery = query(
        collection(db, "orders"),
        where("status", "==", "Placed")
    );

    const unsubscribe = onSnapshot(availableOrdersQuery, async (snapshot) => {
        const fetchedAvailableOrdersPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
        let fetchedAvailableOrders = await Promise.all(fetchedAvailableOrdersPromises);

        fetchedAvailableOrders = fetchedAvailableOrders.filter(order => 
            !order.accessibleTo || order.accessibleTo.length === 0 || order.accessibleTo.includes(currentUser.uid)
        );

        setAvailableOrders(fetchedAvailableOrders);

        fetchedAvailableOrders.forEach(order => {
            if (!notifiedOrderIds.current.has(order.id)) {
                createNotification(currentUser.uid, {
                    title: 'New Order Available',
                    message: `An order worth ₹${order.estimatedEarnings.toFixed(2)} is available for you to accept.`,
                    link: `/orders/${order.id}`,
                });
                notifiedOrderIds.current.add(order.id);
            }
        });

        setIsLoadingAvailableOrders(false);

    }, (error) => {
      console.error("Error fetching available orders:", error);
      toast({ variant: "destructive", title: "Load Failed", description: "Could not check for new orders." });
      setIsLoadingAvailableOrders(false);
    });

    return () => unsubscribe();
  }, [currentUser, toast, availabilityStatus]);


  // Listener for ACTIVE orders assigned to the driver
  useEffect(() => {
    if (!currentUser) {
        setIsLoadingOrders(false);
        return;
    }
    setIsLoadingOrders(true);

    const activeOrdersQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("status", "in", ["accepted", "arrived-at-store", "picked-up", "out-for-delivery", "arrived"])
    );
     const unsubscribe = onSnapshot(activeOrdersQuery, async (snapshot) => {
        const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
        const fetchedActiveOrders = await Promise.all(ordersDataPromises);
        
        setActiveOrders(fetchedActiveOrders.sort((a, b) => (a.completedAt?.seconds || 0) - (b.completedAt?.seconds || 0)));
        setIsLoadingOrders(false);
     }, (error) => {
      console.error("Error fetching active orders:", error);
      toast({ variant: "destructive", title: "Load Failed", description: "Could not load your active orders." });
      setIsLoadingOrders(false);
    });

     return () => unsubscribe();
  }, [currentUser, toast]);


  const handleOrderAccept = async (orderToAccept: Order) => {
    if (!currentUser) return;

    const orderRef = doc(db, "orders", orderToAccept.id);
    try {
      await updateDoc(orderRef, {
        deliveryPartnerId: currentUser.uid,
        status: "accepted",
        accessibleTo: [], 
      });
      
      toast({
            title: "Order Accepted!",
            description: "The order has been added to your active list.",
            className: "bg-green-500 text-white"
      });
    } catch (error) {
        console.error("Error accepting order:", error);
        toast({ variant: "destructive", title: "Acceptance Failed", description: "Could not accept the order."});
    }
  };

  const handleAvailabilityChange = async (newStatus: Required<Profile['availabilityStatus']>) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "Not logged in." });
      return;
    }
    setIsAvailabilityLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, { availabilityStatus: newStatus });
      // The onSnapshot listener will update the state, no need to set it here
      toast({ title: "Status Updated", description: `You are now ${newStatus}.`});
    } catch (error) {
      console.error("Error updating availability status:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update status." });
    } finally {
      // The snapshot listener will set this to false eventually
    }
  };
  
  const handleCustomerChatOpen = (order: Order) => {
    setCustomerChatOrder(order);
  };
  
  return (
    <div className="space-y-6 pb-6">

        <DashboardHeader
            profile={profile}
            availabilityStatus={availabilityStatus}
            onStatusChange={handleAvailabilityChange}
            isAvailabilityLoading={isAvailabilityLoading}
        />

      {customerChatOrder && (
        <CustomerChatDialog
          order={customerChatOrder}
          open={!!customerChatOrder}
          onOpenChange={(isOpen) => !isOpen && setCustomerChatOrder(null)}
        />
      )}
        
        <div className="space-y-6">
            <Card className="shadow-lg md:mx-4 md:rounded-xl">
                <Tabs defaultValue="active-orders">
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="active-orders">
                                <PackageCheck className="mr-2 h-4 w-4" /> Active Orders
                            </TabsTrigger>
                            <TabsTrigger value="available-orders">
                                <PackagePlus className="mr-2 h-4 w-4" /> Available Orders
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    
                    <TabsContent value="active-orders">
                         <CardContent className="p-4 pt-0">
                            {isLoadingOrders ? (
                                <div className="flex justify-center items-center p-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : activeOrders.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                <p className="text-sm mt-1">Accept an order to get started.</p>
                                </div>
                            )}
                        </CardContent>
                    </TabsContent>

                    <TabsContent value="available-orders">
                        <CardContent className="p-4 pt-0">
                             {isLoadingAvailableOrders ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Skeleton className="h-64 w-full" />
                                    <Skeleton className="h-64 w-full hidden md:block" />
                                </div>
                            ) : availableOrders.length > 0 && availabilityStatus === 'online' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableOrders.map((order) => (
                                    <AvailableOrderCard 
                                    key={order.id} 
                                    order={order} 
                                    onAccept={handleOrderAccept}
                                    />
                                ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground border-border">
                                    <p className="font-semibold text-lg">No new orders available right now.</p>
                                    <p className="text-sm mt-1">{availabilityStatus !== 'online' ? "You are currently offline." : "Check back soon!"}</p>
                                </div>
                            )}
                        </CardContent>
                    </TabsContent>
                </Tabs>
            </Card>

            <div className="md:px-4">
              <EarningsForecast />
            </div>
        </div>
    </div>
  );
}

    
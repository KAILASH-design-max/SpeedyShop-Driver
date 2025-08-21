
"use client";

import { useEffect, useState, useRef } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order, Profile } from "@/types";
import { PackageCheck, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
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
  const seenOrderIds = useRef(new Set<string>());

  useEffect(() => {
    // Load active orders from cache on initial render
    try {
      const cachedActiveOrders = localStorage.getItem('activeOrdersCache');
      if (cachedActiveOrders) {
        const parsedOrders: Order[] = JSON.parse(cachedActiveOrders);
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


  // Dedicated listener for NEWLY ASSIGNED orders to show the popup
  useEffect(() => {
    if (!currentUser) return;
    
    const newOrderQuery = query(
      collection(db, "orders"),
      where("orderStatus", "==", "Placed"),
      where("accessibleTo", "array-contains", currentUser.uid)
    );
    
    const unsubscribeNewOrder = onSnapshot(newOrderQuery, async (snapshot) => {
        if (snapshot.empty) {
            setNewOrder(null);
            return;
        }

      const assignedOrdersPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
      const assignedOrders = await Promise.all(assignedOrdersPromises);
      
      const justAssignedOrder = assignedOrders.find(order => !seenOrderIds.current.has(order.id));

      if (justAssignedOrder) {
        setNewOrder(justAssignedOrder);
        seenOrderIds.current.add(justAssignedOrder.id);
      }
    }, (error) => {
        console.error("Error fetching newly assigned orders:", error);
        if (error.code !== 'permission-denied') {
          toast({ variant: "destructive", title: "Notification Error", description: "Could not listen for new orders."});
        }
    });

    return () => unsubscribeNewOrder();
  }, [currentUser, toast]);


  // Listener for ALL OTHER ACTIVE orders (from accepted to arrived)
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

      const orderRef = doc(db, "orders", orderToAccept.id);
      try {
        await updateDoc(orderRef, {
          deliveryPartnerId: currentUser.uid,
          orderStatus: "accepted",
          accessibleTo: [], // Clear the accessibleTo field after acceptance
        });
        
        setNewOrder(null); // Dismiss the card immediately
      
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
  
  const handleCustomerChatOpen = (order: Order) => {
    setCustomerChatOrder(order);
  };
  
  const handleNewOrderDismiss = async (orderToDismiss: Order) => {
    if (newOrder && currentUser) {
      // To dismiss, we remove the current user from the `accessibleTo` array.
      const orderRef = doc(db, "orders", orderToDismiss.id);
      try {
        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) return;

        const currentOrderDoc = await mapFirestoreDocToOrder(orderDoc);
        const updatedAccessibleTo = (currentOrderDoc.accessibleTo || []).filter(uid => uid !== currentUser.uid);

        await updateDoc(orderRef, {
          accessibleTo: updatedAccessibleTo
        });
        
        seenOrderIds.current.add(orderToDismiss.id);
        setNewOrder(null);
      } catch (error) {
        console.error("Error dismissing order:", error);
        toast({ variant: "destructive", title: "Dismiss Failed", description: "Could not dismiss the order."});
      }
    }
    setNewOrder(null);
  }

  return (
    <div className="p-6 space-y-6">

      {newOrder && (
        <NewOrderCard 
          order={newOrder}
          onDismiss={() => handleNewOrderDismiss(newOrder)}
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

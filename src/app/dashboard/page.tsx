
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
  
  // UNIFIED LISTENER FOR NEW AND ACTIVE ORDERS
  useEffect(() => {
      if (!currentUser) {
          setLoading(false);
          setActiveOrders([]);
          setNewOrder(null);
          return;
      }
  
      setLoading(true);
  
      // This query gets all orders that are either assigned to the driver OR available for them to accept.
      // NOTE: Firestore does not support logical OR queries on different fields.
      // We must fetch both and merge them on the client. This is acceptable for a small number of drivers.
      // For a larger scale app, a backend would manage a dedicated 'jobs' collection for each driver.
  
      const activeOrdersQuery = query(
          collection(db, "orders"),
          where("deliveryPartnerId", "==", currentUser.uid),
          where("orderStatus", "in", ["accepted", "arrived-at-store", "picked-up", "out-for-delivery", "arrived"])
      );
  
      const availableOrdersQuery = query(
          collection(db, "orders"),
          where("orderStatus", "==", "Placed"),
          where("accessibleTo", "array-contains", currentUser.uid)
      );
  
      const unsubscribeActive = onSnapshot(activeOrdersQuery, async (snapshot) => {
          const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
          const newActiveOrders = await Promise.all(ordersDataPromises);
          
          setActiveOrders(newActiveOrders);
          newActiveOrders.forEach(order => seenOrderIds.current.add(order.id));
          
          try {
              localStorage.setItem('activeOrdersCache', JSON.stringify(newActiveOrders));
          } catch (error) {
              console.error("Failed to cache active orders:", error);
          }
          setLoading(false);
      }, (error) => {
          console.error("Error fetching active orders:", error);
          if (error.code !== 'permission-denied') {
              toast({ variant: "destructive", title: "Load Failed", description: "Could not load active orders."});
          }
          setLoading(false);
      });
  
      const unsubscribeAvailable = onSnapshot(availableOrdersQuery, async (snapshot) => {
          if (snapshot.empty) {
              setNewOrder(null);
              return;
          }
          
          const assignedOrdersPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
          const assignedOrders = await Promise.all(assignedOrdersPromises);
          
          // Find the first available order that hasn't been seen/dismissed
          const justAssignedOrder = assignedOrders.find(order => !seenOrderIds.current.has(order.id));
  
          if (justAssignedOrder) {
              setNewOrder(justAssignedOrder);
          } else {
              setNewOrder(null);
          }
      }, (error) => {
          console.error("Error fetching newly assigned orders:", error);
          if (error.code !== 'permission-denied') {
              toast({ variant: "destructive", title: "Notification Error", description: "Could not listen for new orders."});
          }
      });
  
      return () => {
          unsubscribeActive();
          unsubscribeAvailable();
      };
  
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
        
        // Remove the order from the new order state
        setNewOrder(null);
        // Add its ID to the seen set to prevent it from reappearing as new
        seenOrderIds.current.add(orderToAccept.id);
      
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
    if (currentUser) {
      // Add to seen list so it doesn't pop up again this session
      seenOrderIds.current.add(orderToDismiss.id);
      setNewOrder(null);
      
      // Attempt to remove user from accessibleTo list so they don't get it again from the backend.
      // This is an optimistic update.
      const orderRef = doc(db, "orders", orderToDismiss.id);
      try {
        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) return;

        const currentOrderDoc = await mapFirestoreDocToOrder(orderDoc);
        const updatedAccessibleTo = (currentOrderDoc.accessibleTo || []).filter(uid => uid !== currentUser.uid);

        await updateDoc(orderRef, {
          accessibleTo: updatedAccessibleTo
        });
      } catch (error) {
        console.error("Error dismissing order:", error);
        // Don't toast here as it's a non-critical background failure
      }
    }
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

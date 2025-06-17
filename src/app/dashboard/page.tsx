
"use client";

import { useEffect, useState } from "react";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order } from "@/types";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, PackageCheck, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, DocumentData } from "firebase/firestore";

export default function DashboardPage() {
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingActive, setLoadingActive] = useState(true);

  useEffect(() => {
    // Listener for new orders
    const newOrdersQuery = query(collection(db, "orders"), where("status", "==", "new"));
    const unsubscribeNew = onSnapshot(newOrdersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setNewOrders(ordersData);
      setLoadingNew(false);
    }, (error) => {
      console.error("Error fetching new orders:", error);
      setLoadingNew(false);
    });

    // Listener for active orders
    const activeOrdersQuery = query(collection(db, "orders"), where("status", "in", ["accepted", "picked-up", "out-for-delivery"]));
    const unsubscribeActive = onSnapshot(activeOrdersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setActiveOrders(ordersData);
      setLoadingActive(false);
    }, (error) => {
      console.error("Error fetching active orders:", error);
      setLoadingActive(false);
    });

    return () => {
      unsubscribeNew();
      unsubscribeActive();
    };
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <AvailabilityToggle />
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

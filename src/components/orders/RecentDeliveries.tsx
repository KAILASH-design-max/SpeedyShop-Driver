
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Order } from "@/types";
import { Loader2 } from "lucide-react";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { format } from "date-fns";

export function RecentDeliveries() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setDeliveries([]);
      return;
    }

    setLoading(true);

    // Fetch all delivered orders for the partner, ordered by most recent
    const deliveriesQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("orderStatus", "==", "delivered"),
      orderBy("completedAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      deliveriesQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          setDeliveries([]);
          setLoading(false);
          return;
        }

        const ordersDataPromises = snapshot.docs.map((doc) =>
          mapFirestoreDocToOrder(doc)
        );
        const ordersData = await Promise.all(ordersDataPromises);

        setDeliveries(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching delivery history:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) {
      return "N/A";
    }
    try {
      const date = timestamp.toDate();
      return format(date, "MMM d, yyyy, p");
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Delivery History</CardTitle>
        <CardDescription>
          A log of your most recent completed deliveries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading delivery history...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            <p>You have no completed deliveries yet.</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">
                      #{delivery.id.substring(0, 6)}
                    </TableCell>
                    <TableCell>{delivery.customerName}</TableCell>
                    <TableCell>{formatTimestamp(delivery.completedAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="capitalize bg-green-100 text-green-800 border-green-200"
                      >
                        {delivery.orderStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ₹{(delivery.estimatedEarnings || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

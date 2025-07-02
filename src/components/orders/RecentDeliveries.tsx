
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Order } from "@/types";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function RecentDeliveries() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const deliveriesQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("orderStatus", "in", ["delivered", "cancelled"]),
      where("completedAt", ">=", startOfDay),
      where("completedAt", "<=", endOfDay),
      orderBy("completedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      deliveriesQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          setDeliveries([]);
        } else {
          const ordersDataPromises = snapshot.docs.map((doc) =>
            mapFirestoreDocToOrder(doc)
          );
          const ordersData = await Promise.all(ordersDataPromises);
          setDeliveries(ordersData);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching delivery history:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, selectedDate]);

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) {
      return "N/A";
    }
    try {
      const date = timestamp.toDate();
      return format(date, "dd-MM-yy hh:mm a");
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  const getStatusBadgeClass = (status: Order['orderStatus']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Delivery History</CardTitle>
        <CardDescription>
          Select a date to view your delivery history.
        </CardDescription>
        <div className="pt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading delivery history...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            <p>No deliveries found for this date.</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount Earned</TableHead>
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
                        className={cn("capitalize", getStatusBadgeClass(delivery.orderStatus))}
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

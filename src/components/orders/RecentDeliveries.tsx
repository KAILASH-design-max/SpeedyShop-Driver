
"use client";

import { useState, useEffect } from "react";
import {
  CardDescription,
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
  doc,
  getDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Order, Profile, DeliveryRating } from "@/types";
import { Loader2, Calendar as CalendarIcon, Package } from "lucide-react";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/components/earnings/PayoutHistoryTable";

interface RecentDeliveriesProps {
    onDeliveriesFetched: (deliveries: Order[]) => void;
    onTransactionsCalculated: (transactions: Transaction[]) => void;
}

export function RecentDeliveries({ onDeliveriesFetched, onTransactionsCalculated }: RecentDeliveriesProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Set the initial date only on the client side to avoid hydration mismatch
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser || !selectedDate) {
      setLoading(false);
      setDeliveries([]);
      onDeliveriesFetched([]);
      onTransactionsCalculated([]);
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
        let fetchedDeliveries: Order[] = [];
        if (!snapshot.empty) {
          const ordersDataPromises = snapshot.docs.map((doc) =>
            mapFirestoreDocToOrder(doc)
          );
          fetchedDeliveries = await Promise.all(ordersDataPromises);
        }
        setDeliveries(fetchedDeliveries);
        onDeliveriesFetched(fetchedDeliveries);
        
        // Now calculate transactions
        const deliveryTransactions: Transaction[] = fetchedDeliveries.map(d => ({
            title: `Delivery Pay (Order #${d.id.substring(0,6)})`,
            transactionId: d.id,
            type: 'Delivery',
            amount: d.estimatedEarnings
        }));
        
        // Fetch tips for the same day
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let tipTransactions: Transaction[] = [];
        if (userDocSnap.exists()) {
            const profile = userDocSnap.data() as Profile;
            const ratings = profile.deliveryRatings || [];
            
            ratings.forEach((rating: DeliveryRating) => {
                if(rating.tip && rating.tip > 0 && rating.ratedAt) {
                    const ratedDate = rating.ratedAt.toDate();
                    if (ratedDate >= startOfDay && ratedDate <= endOfDay) {
                         tipTransactions.push({
                            title: `Customer Tip (Order #${rating.orderId.substring(0,6)})`,
                            transactionId: `${rating.orderId}-tip`,
                            type: 'Tip',
                            amount: rating.tip
                        });
                    }
                }
            });
        }
        
        const allTransactions = [...deliveryTransactions, ...tipTransactions];
        onTransactionsCalculated(allTransactions);

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching delivery history:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, selectedDate, onDeliveriesFetched, onTransactionsCalculated]);

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
    <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <CardTitle className="text-2xl font-bold flex items-center"><Package className="mr-2 h-6 w-6"/>Delivery History</CardTitle>
                <CardDescription className="mt-1">
                Select a date to view your delivery records.
                </CardDescription>
            </div>
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
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                />
                </PopoverContent>
            </Popover>
        </div>
      
        <div className="mt-6">
            {loading ? (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading delivery history...</p>
            </div>
            ) : deliveries.length === 0 ? (
            <div className="text-center text-muted-foreground p-8 border rounded-lg">
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
        </div>
    </div>
  );
}

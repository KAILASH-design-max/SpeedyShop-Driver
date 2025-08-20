
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
  Timestamp,
  getDocs,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Order, Profile, DeliveryRating } from "@/types";
import { Loader2, Calendar as CalendarIcon, Package, Link2, XCircle, MessageSquare } from "lucide-react";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/components/earnings/PayoutHistoryTable";
import Link from "next/link";
import { DateRange } from "react-day-picker";

interface RecentDeliveriesProps {
    onDeliveriesFetched: (deliveries: Order[]) => void;
    onTransactionsCalculated: (transactions: Transaction[]) => void;
}

type StatusFilter = "all" | "delivered" | "cancelled";

export function RecentDeliveries({ onDeliveriesFetched, onTransactionsCalculated }: RecentDeliveriesProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allDeliveries, setAllDeliveries] = useState<Order[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');


  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect to fetch ALL deliveries for the user
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setAllDeliveries([]);
      return;
    }

    setLoading(true);

    const deliveriesQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("orderStatus", "in", ["delivered", "cancelled"]),
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
        setAllDeliveries(fetchedDeliveries);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching delivery history:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Effect to filter deliveries and calculate transactions when date or allDeliveries change
  useEffect(() => {
    if (loading) return;

    let deliveriesToDisplay = allDeliveries;
    
    // Filter by status first
    if (statusFilter !== 'all') {
        deliveriesToDisplay = deliveriesToDisplay.filter(d => d.orderStatus === statusFilter);
    }
    
    // Then filter by date range
    if (dateRange?.from) {
        deliveriesToDisplay = deliveriesToDisplay.filter(delivery => {
            if (!delivery.completedAt?.toDate) return false;
            const completedDate = delivery.completedAt.toDate();
            const fromDate = dateRange.from;
            const toDate = dateRange.to || fromDate; // If no 'to' date, use 'from' as single day
            return completedDate >= fromDate && completedDate <= new Date(toDate.setHours(23, 59, 59, 999));
        });
    }

    setFilteredDeliveries(deliveriesToDisplay);
    onDeliveriesFetched(deliveriesToDisplay);

    const calculateTransactions = async () => {
        const deliveryTransactions: Transaction[] = deliveriesToDisplay
            .filter(d => d.orderStatus === 'delivered')
            .map(d => ({
                title: `Delivery Pay (Order #${d.id})`,
                transactionId: `${d.id}-delivery`,
                type: 'Delivery',
                amount: d.estimatedEarnings || 0
            }));

        if (!currentUser) {
            onTransactionsCalculated(deliveryTransactions);
            return;
        }
        
        let tipTransactions: Transaction[] = [];
        
        const deliveryIds = deliveriesToDisplay.map(d => d.id);

        if(deliveryIds.length > 0) {
             // Firestore 'in' query has a limit of 30 values. We need to chunk the array.
            const chunkArray = <T>(arr: T[], size: number): T[][] =>
              Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
                arr.slice(i * size, i * size + size)
              );

            const chunks = chunkArray(deliveryIds, 30);
            const ratingsPromises = chunks.map(chunk => {
                 const ratingsQuery = query(
                    collection(db, 'deliveryPartnerRatings'),
                    where('deliveryPartnerId', '==', currentUser.uid),
                    where('orderId', 'in', chunk)
                );
                return getDocs(ratingsQuery);
            });
            
            const ratingsSnapshots = await Promise.all(ratingsPromises);

            ratingsSnapshots.forEach(snapshot => {
                 snapshot.forEach(doc => {
                    const rating = doc.data() as DeliveryRating;
                    if(rating.tip && rating.tip > 0) {
                        tipTransactions.push({
                            title: `Customer Tip (Order #${rating.orderId})`,
                            transactionId: `${rating.orderId}-tip`,
                            type: 'Tip',
                            amount: rating.tip
                        });
                    }
                });
            });
        }
        
        const allTransactions = [...deliveryTransactions, ...tipTransactions];
        onTransactionsCalculated(allTransactions);
    };

    calculateTransactions();

  }, [dateRange, statusFilter, allDeliveries, currentUser, loading, onDeliveriesFetched, onTransactionsCalculated]);


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
                 View all your past deliveries. Use filters to narrow down the results.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full sm:w-[260px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                    />
                    </PopoverContent>
                </Popover>
                 {dateRange && (
                    <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}>
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                    </Button>
                 )}
            </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4">
            <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>All</Button>
            <Button variant={statusFilter === 'delivered' ? 'default' : 'outline'} onClick={() => setStatusFilter('delivered')}>Delivered</Button>
            <Button variant={statusFilter === 'cancelled' ? 'default' : 'outline'} onClick={() => setStatusFilter('cancelled')}>Cancelled</Button>
        </div>
      
        <div className="mt-6">
            {loading ? (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading delivery history...</p>
            </div>
            ) : filteredDeliveries.length === 0 ? (
            <div className="text-center text-muted-foreground p-8 border rounded-lg">
                <p>No deliveries found for the selected filters.</p>
            </div>
            ) : (
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Completed At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount Earned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                        <TableCell className="font-medium">
                           <Link href={`/orders/${delivery.id}`} className="flex items-center gap-1 text-primary hover:underline">
                             #{delivery.id} <Link2 size={12}/>
                           </Link>
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
                        <TableCell className="font-semibold text-green-600">
                          {delivery.orderStatus === 'delivered' ? `₹${(delivery.estimatedEarnings || 0).toFixed(2)}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="icon" disabled={true}>
                                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                           </Button>
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

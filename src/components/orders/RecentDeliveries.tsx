
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
import { Loader2, Calendar as CalendarIcon, Package, Link2, XCircle, MessageSquare, IndianRupee } from "lucide-react";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import { format, isSameDay, subDays, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DateRange } from "react-day-picker";

interface RecentDeliveriesProps {
    // No props needed now, it's self-contained
}

type StatusFilter = "all" | "delivered" | "cancelled";

export function RecentDeliveries({}: RecentDeliveriesProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allDeliveries, setAllDeliveries] = useState<Order[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Order[]>([]);
  const [tips, setTips] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');


  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect to fetch ALL deliveries and tips for the user
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setAllDeliveries([]);
      return;
    }

    setLoading(true);

    const thirtyDaysAgo = subDays(startOfToday(), 30);

    const deliveriesQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("orderStatus", "in", ["delivered", "cancelled"]),
      where("completedAt", ">=", thirtyDaysAgo),
      orderBy("completedAt", "desc")
    );
    
    const ratingsQuery = query(
        collection(db, 'deliveryPartnerRatings'),
        where('deliveryPartnerId', '==', currentUser.uid),
        where('ratedAt', '>=', thirtyDaysAgo)
    );

    const unsubscribeDeliveries = onSnapshot(
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
    
    const unsubscribeRatings = onSnapshot(ratingsQuery, (snapshot) => {
        const fetchedTips: Record<string, number> = {};
        snapshot.forEach(doc => {
            const rating = doc.data() as DeliveryRating;
            if (rating.tip && rating.tip > 0) {
                fetchedTips[rating.orderId] = rating.tip;
            }
        });
        setTips(fetchedTips);
    });

    return () => {
        unsubscribeDeliveries();
        unsubscribeRatings();
    };
  }, [currentUser]);

  // Effect to filter deliveries when date or status changes
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
            const completedDate = delivery.completedAt?.toDate ? delivery.completedAt.toDate() : null;
            if (!completedDate) return false;
            // Reset time to start of day for 'from' and end of day for 'to' for accurate range selection
            const fromDate = new Date(dateRange.from!.setHours(0, 0, 0, 0));
            const toDate = dateRange.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)) : new Date(fromDate.setHours(23, 59, 59, 999));
            return completedDate >= fromDate && completedDate <= toDate;
        });
    }

    setFilteredDeliveries(deliveriesToDisplay);

  }, [dateRange, statusFilter, allDeliveries, loading]);


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
                 Viewing your deliveries from the last 30 days. Use filters to narrow down the results.
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
                    <TableHead className="text-right">Earnings</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredDeliveries.map((delivery) => {
                        const tipAmount = tips[delivery.id] || 0;
                        const totalEarnings = (delivery.estimatedEarnings || 0) + tipAmount;
                        return (
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
                                <TableCell className="text-right font-semibold">
                                {delivery.orderStatus === 'delivered' ? (
                                    <div className="flex flex-col items-end">
                                        <span className="text-green-600 flex items-center">
                                            <IndianRupee size={14} className="mr-0.5" /> {totalEarnings.toFixed(2)}
                                        </span>
                                        {tipAmount > 0 && (
                                            <span className="text-xs text-orange-500">(Tip: ₹{tipAmount.toFixed(2)})</span>
                                        )}
                                    </div>
                                ) : 'N/A'}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
                </Table>
            </div>
            )}
        </div>
    </div>
  );
}

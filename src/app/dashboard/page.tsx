
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { Order } from "@/types";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, PackageCheck } from "lucide-react";

const mockNewOrders: Order[] = [
  {
    id: "ORD123XYZ",
    customerName: "Alice Smith",
    pickupLocation: "North Dark Store",
    dropOffLocation: "123 Main St, Anytown",
    items: ["Groceries", "Snacks"],
    status: "new",
    estimatedEarnings: 7.50,
    estimatedTime: 25,
  },
  {
    id: "ORD456ABC",
    customerName: "Bob Johnson",
    pickupLocation: "Central Warehouse",
    dropOffLocation: "456 Oak Ave, Anytown",
    items: ["Electronics"],
    status: "new",
    estimatedEarnings: 12.00,
    estimatedTime: 40,
  },
];

const mockActiveOrders: Order[] = [
  {
    id: "ORD789DEF",
    customerName: "Carol White",
    pickupLocation: "East Dark Store",
    dropOffLocation: "789 Pine Ln, Anytown",
    items: ["Pharmacy Items"],
    status: "accepted",
    estimatedEarnings: 9.25,
    estimatedTime: 30,
  },
];

export default function DashboardPage() {
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
            {mockNewOrders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mockNewOrders.map((order) => (
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
            {mockActiveOrders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mockActiveOrders.map((order) => (
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

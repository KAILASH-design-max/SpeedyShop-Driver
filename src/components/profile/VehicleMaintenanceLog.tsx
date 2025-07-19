
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, PlusCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Profile, MaintenanceLogEntry } from "@/types";

const logSchema = z.object({
  serviceType: z.string().min(1, "Service type is required"),
  cost: z.coerce.number().min(0, "Cost must be a positive number"),
  notes: z.string().optional(),
});

interface VehicleMaintenanceLogProps {
  profile: Profile;
  onUpdate: (data: { newMaintenanceLog: Omit<MaintenanceLogEntry, 'id' | 'date'> }) => Promise<void>;
}

export function VehicleMaintenanceLog({ profile, onUpdate }: VehicleMaintenanceLogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof logSchema>>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      serviceType: "",
      cost: 0,
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof logSchema>) {
    setIsSaving(true);
    try {
      await onUpdate({ newMaintenanceLog: values });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to add maintenance log:", error);
    } finally {
      setIsSaving(false);
    }
  }
  
  const sortedLogs = [...(profile.maintenanceLog || [])].sort((a, b) => b.date.seconds - a.date.seconds);

  return (
    <Card className="shadow-xl">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <CardTitle className="flex items-center text-2xl font-bold text-primary">
            <Wrench className="mr-3 h-6 w-6" />
            Vehicle Maintenance Log
          </CardTitle>
          <CardDescription>
            Keep track of your vehicle's service history and expenses.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-2 sm:mt-0">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Log
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Maintenance Log</DialogTitle>
              <DialogDescription>
                Enter the details of the service performed on your vehicle.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Oil Change, Tire Rotation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Used synthetic oil, replaced air filter." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <DialogFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Log
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.length > 0 ? (
                sortedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.serviceType}</TableCell>
                    <TableCell>{format(log.date.toDate(), "PPP")}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs">{log.notes || 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{log.cost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No maintenance logs found. Add your first one!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

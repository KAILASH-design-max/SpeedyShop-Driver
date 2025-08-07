
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { optimizeDeliveryRoute, OptimizeDeliveryRouteOutput } from "@/ai/flows/optimize-delivery-route";
import { useState } from "react";
import { Loader2, MapPin, Route as RouteIcon, Clock, Info, ListOrdered, Navigation, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  currentLocation: z.string().min(1, "Current location is required."),
  destinationAddresses: z.array(z.object({ address: z.string().min(1, "Address cannot be empty.") })).min(1, "At least one destination is required."),
  trafficConditions: z.string().optional(),
  weatherConditions: z.string().optional(),
});

export function RouteOptimizer() {
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizeDeliveryRouteOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentLocation: "", // TODO: Get from GPS in a real app
      destinationAddresses: [{ address: "" }],
      trafficConditions: "",
      weatherConditions: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "destinationAddresses",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setOptimizedRoute(null);
    try {
      const result = await optimizeDeliveryRoute({
        ...values,
        destinationAddresses: values.destinationAddresses.map(d => d.address),
      });
      setOptimizedRoute(result);
      toast({
        title: "Route Optimized!",
        description: "Your delivery route has been successfully optimized.",
        className: "bg-green-500 text-white"
      });
    } catch (error) {
      console.error("Error optimizing route:", error);
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description: "Could not optimize the route. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleStartNavigation = () => {
    if (optimizedRoute?.optimizedRoute && optimizedRoute.optimizedRoute.length > 0) {
      // Create a Google Maps URL with waypoints
      const origin = form.getValues("currentLocation");
      const destination = optimizedRoute.optimizedRoute[optimizedRoute.optimizedRoute.length - 1];
      const waypoints = optimizedRoute.optimizedRoute.slice(0, -1).join('|');
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
      window.open(mapsUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-primary"><RouteIcon className="mr-2 h-7 w-7"/>Smart Route Optimizer</CardTitle>
          <CardDescription className="hidden md:block">Enter details to get the fastest and most efficient delivery route.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground"/>Current Location (Lat, Long or Address)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 12.9716,77.5946 or 1 Main St, Anytown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel className="flex items-center mb-2"><MapPin className="mr-2 h-4 w-4 text-muted-foreground"/>Destination Addresses</FormLabel>
                {fields.map((field, index) => (
                  <FormField
                    control={form.control}
                    key={field.id}
                    name={`destinationAddresses.${index}.address`}
                    render={({ field: itemField }) => (
                      <FormItem className="flex items-center gap-2 mb-2">
                        <FormControl>
                          <Input placeholder={`Destination ${index + 1}`} {...itemField} />
                        </FormControl>
                        {fields.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Remove destination">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ address: "" })}
                  className="mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Destination
                </Button>
              </div>

              <FormField
                control={form.control}
                name="trafficConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><RouteIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Traffic Conditions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Heavy traffic on Main St due to event" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weatherConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground"/>Weather Conditions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Light rain, roads might be slippery" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <RouteIcon className="mr-2 h-5 w-5" />
                )}
                Optimize Route
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {optimizedRoute && (
        <Card className="shadow-lg mt-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-green-700"><ListOrdered className="mr-2 h-6 w-6"/>Optimized Route Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-green-800">
            <div>
              <h4 className="font-semibold flex items-center"><RouteIcon className="mr-2 h-5 w-5"/>Delivery Order:</h4>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                {optimizedRoute.optimizedRoute.map((stop, index) => (
                  <li key={index}>{stop}</li>
                ))}
              </ol>
            </div>
            <p className="flex items-center"><Clock className="mr-2 h-5 w-5"/><strong>Estimated Time:</strong> {optimizedRoute.estimatedTime}</p>
            <p className="flex items-center"><Info className="mr-2 h-5 w-5"/><strong>Summary:</strong> {optimizedRoute.routeSummary}</p>
            <Button onClick={handleStartNavigation} className="w-full bg-green-600 hover:bg-green-700 text-white mt-4">
                <Navigation className="mr-2 h-5 w-5" /> Start Navigation for Optimized Route
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

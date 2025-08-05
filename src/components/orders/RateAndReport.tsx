
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
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsDown, Send, Loader2, Check } from "lucide-react";
import type { Order, DeliveryPartnerFeedback } from "@/types";

const feedbackSchema = z.object({
  pickupRating: z.number().min(1, "Please provide a rating.").max(5),
  reportReason: z.string().optional(),
  comments: z.string().optional(),
});

interface RateAndReportProps {
  order: Order;
  onSubmit: (feedback: DeliveryPartnerFeedback) => Promise<void>;
  isSubmitting: boolean;
}

const reportReasons = [
    "Incorrect address",
    "Customer unavailable",
    "Rude customer",
    "Long wait time at customer location",
    "Other issue (specify in comments)",
];

export function RateAndReport({ order, onSubmit, isSubmitting }: RateAndReportProps) {
  const [rating, setRating] = useState(0);

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      pickupRating: 0,
      reportReason: "",
      comments: "",
    },
  });
  
  const handleFormSubmit = (values: z.infer<typeof feedbackSchema>) => {
    onSubmit({
        ...values,
        pickupRating: rating,
    });
  }

  if (order.deliveryPartnerFeedback) {
      return (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-blue-800">
              <Check className="mr-2 h-6 w-6" /> Feedback Submitted
            </CardTitle>
            <CardDescription>
                Thank you for your feedback on this order.
            </CardDescription>
          </CardHeader>
        </Card>
      );
  }

  return (
    <Card className="shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <ThumbsDown className="mr-2 h-6 w-6 text-primary" /> Rate & Report
        </CardTitle>
        <CardDescription>
          Provide feedback on the store pickup or report an issue with the delivery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="pickupRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Rate the Store Pickup Experience
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-8 w-8 cursor-pointer transition-colors ${
                            star <= rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300 hover:text-gray-400"
                          }`}
                          onClick={() => {
                            setRating(star);
                            field.onChange(star);
                          }}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reportReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report an Issue (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason if you had an issue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reportReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional details here..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit Feedback
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

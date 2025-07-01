
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LifeBuoy, MessageSquare } from "lucide-react";
import Link from "next/link";

const faqItems = [
  {
    question: "How do I update my bank details?",
    answer:
      "You can update your bank details from the Profile page. Navigate to Profile > Bank Details, enter your information, and click 'Save Changes'.",
  },
  {
    question: "What do the different order statuses mean?",
    answer:
      "Placed: A new order is available for you to accept. Accepted: You have accepted the order. Picked-up: You have collected the order from the store. Out-for-delivery: You are on your way to the customer. Delivered: The order is complete.",
  },
    {
    question: "How is my availability status used?",
    answer:
      "Your availability status determines if you receive new order alerts. 'Online' means you are ready for orders. 'On Break' and 'Offline' will prevent new orders from being shown to you. You can still manage active orders while on break or offline.",
  },
  {
    question: "I'm having trouble with the app. What should I do?",
    answer:
      "First, please try restarting the app completely. If the problem persists, use the 'Contact Support' button below to start a chat with our support team for assistance.",
  },
];

export function Support() {
  return (
    <Card className="shadow-xl max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary">
          <LifeBuoy className="mr-3 h-7 w-7" />
          Support Center
        </CardTitle>
        <CardDescription>
          Find answers to common questions or get in touch with our support
          team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Frequently Asked Questions
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center pt-6 border-t">
          <h3 className="text-xl font-semibold mb-2 text-foreground">
            Still need help?
          </h3>
          <p className="text-muted-foreground mb-4">
            If you can't find the answer you're looking for, feel free to
            contact our support team directly.
          </p>
          <Link href="/communication" asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <MessageSquare className="mr-2 h-5 w-5" />
              Contact Support
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

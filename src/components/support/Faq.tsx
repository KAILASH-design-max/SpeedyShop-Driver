"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const faqItems = [
  {
    question: "How are my earnings calculated?",
    answer: "Your earnings are calculated based on the base fare for each delivery, plus distance traveled, and any applicable bonuses or tips. You can see a detailed breakdown for each completed order in the 'Earnings' section of the app.",
  },
  {
    question: "What do I do if my vehicle breaks down?",
    answer: "If your vehicle breaks down during a delivery, your safety is the first priority. Move to a safe location, then contact support immediately using the live chat or emergency button. We will assist you with the active order and provide further instructions.",
  },
  {
    question: "How can I report a problem with an order?",
    answer: "You can report an issue with an active order by contacting the customer through the app or by using the 'Contact Support' feature. For issues with completed orders, please navigate to the order in your history and select the 'Report an Issue' option.",
  },
  {
    question: "What is the self-redispatch function?",
    answer: "The self-redispatch function allows you to decline an assigned order under specific circumstances (e.g., if the order is too large for your vehicle). Using this feature reassigns the order to another nearby partner. Use this function responsibly, as misuse may affect your performance metrics.",
  },
];

export function Faq() {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <HelpCircle className="mr-2 h-6 w-6 text-primary" /> Frequently Asked Questions
        </CardTitle>
        <CardDescription>
          Find quick answers to common questions.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

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
    answer: "Your earnings are calculated based on a base fare for each delivery, distance traveled, and any applicable bonuses or tips from customers. You can see a detailed breakdown for each completed order in the 'Orders' section.",
  },
  {
    question: "What is the payment cycle?",
    answer: "Payments are processed on a weekly basis. Your earnings from Monday to Sunday are calculated and transferred to your registered bank account by the following Wednesday.",
  },
  {
    question: "What should I do if my vehicle breaks down?",
    answer: "Your safety is the first priority. Move to a safe location, then contact support immediately using the live chat or the emergency SOS button on this page. We will assist you with the active order and provide further instructions.",
  },
  {
    question: "How do I handle incentives and penalties?",
    answer: "Incentive programs are announced in the 'Community' section. Penalties or strikes may be issued for issues like severe delays or unprofessional conduct. You can view and appeal any penalties from your 'Profile' page.",
  },
  {
    question: "When should I mark an order as 'delivered'?",
    answer: "Only mark an order as 'delivered' after you have handed it over to the customer or left it in the safe location specified in the no-contact delivery instructions. For no-contact deliveries, you must upload a photo as proof.",
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

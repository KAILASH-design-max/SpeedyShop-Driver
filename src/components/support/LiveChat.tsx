"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, User, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const messages = [
  { from: "agent", text: "Hello! How can I help you today?", avatar: "S" },
  { from: "user", text: "Hi, I’m having an issue with order #ORD789. The customer is not available at the location." },
  { from: "agent", text: "I understand. Please wait for 5 minutes and try contacting the customer via the app. If there is still no response, I will mark the order for return.", avatar: "S" },
];

export function LiveChat() {
  return (
    <Card className="h-full flex flex-col shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="mr-2 h-6 w-6 text-primary" /> Live Chat
        </CardTitle>
        <CardDescription>Connect with a support agent for immediate help.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-[400px] w-full pr-4">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-end gap-2",
                  message.from === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.from === "agent" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted-foreground text-white">{message.avatar}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg p-3 text-sm",
                    message.from === "user"
                      ? "rounded-br-none bg-primary text-primary-foreground"
                      : "rounded-bl-none bg-muted"
                  )}
                >
                  {message.text}
                </div>
                 {message.from === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground"><User size={16}/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <div className="flex w-full items-center space-x-2">
          <Input type="text" placeholder="Type your message..." />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

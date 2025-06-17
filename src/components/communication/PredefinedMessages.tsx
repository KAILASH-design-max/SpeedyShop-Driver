
"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageCirclePlus } from "lucide-react";

const messages = [
  "I'm on my way!",
  "I have arrived at the pickup location.",
  "I have arrived at the delivery location.",
  "I'm running a bit late due to traffic.",
  "Could you please confirm your address?",
  "Thank you for your patience!",
];

interface PredefinedMessagesProps {
  onSelectMessage: (message: string) => void;
}

export function PredefinedMessages({ onSelectMessage }: PredefinedMessagesProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground">
          <MessageCirclePlus className="mr-2 h-4 w-4" />
          Use a quick message...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="grid gap-1">
          {messages.map((msg, index) => (
            <Button
              key={index}
              variant="ghost"
              className="justify-start px-3 py-2 text-sm rounded-none"
              onClick={() => onSelectMessage(msg)}
            >
              {msg}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}


"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageCirclePlus, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const staticMessages = [
  "I'm on my way!",
  "I have arrived at the pickup location.",
  "I have arrived at the delivery location.",
  "I'm running a bit late due to traffic.",
  "Could you please confirm your address?",
  "Thank you for your patience!",
];

interface PredefinedMessagesProps {
  customMessages?: string[];
  onSelectMessage: (message: string) => void;
}

export function PredefinedMessages({ customMessages = [], onSelectMessage }: PredefinedMessagesProps) {
  const hasCustomMessages = customMessages.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground">
          <MessageCirclePlus className="mr-2 h-4 w-4" />
          Use a quick message...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-sm">
        <div className="grid gap-1">
          {hasCustomMessages && (
            <>
              <p className="p-2 text-xs font-semibold text-muted-foreground flex items-center"><Sparkles className="mr-2 h-4 w-4 text-yellow-500" /> Your Replies</p>
              {customMessages.map((msg, index) => (
                <Button
                  key={`custom-${index}`}
                  variant="ghost"
                  className="justify-start px-3 py-2 text-sm rounded-none h-auto whitespace-normal text-left"
                  onClick={() => onSelectMessage(msg)}
                >
                  {msg}
                </Button>
              ))}
              <Separator />
            </>
          )}
          {staticMessages.map((msg, index) => (
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

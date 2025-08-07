
"use client";

import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, LifeBuoy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LiveChatProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentUserId: string;
}

export function LiveChat({ isOpen, onOpenChange, orderId, currentUserId }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatSessionId = `order_${orderId}`; // Use a consistent ID format

  // Function to ensure a support session for this order exists
  const ensureSupportSessionExists = async () => {
    if (!orderId || !currentUserId) return;
    const sessionRef = doc(db, "supportMessages", chatSessionId);
    try {
        const docSnap = await getDoc(sessionRef);
        if (!docSnap.exists()) {
            await setDoc(sessionRef, {
                userId: currentUserId,
                orderId: orderId,
                status: 'active',
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                lastMessage: `Support chat initiated for order #${orderId.substring(0,6)}`,
            });
        }
    } catch (error) {
        console.error("Error ensuring support session exists:", error);
        toast({ variant: "destructive", title: "Chat Error", description: "Could not initialize support chat." });
    }
  };


  useEffect(() => {
    if (isOpen) {
      ensureSupportSessionExists();
    }
  }, [isOpen, orderId, currentUserId]);


  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const messagesQuery = query(
      collection(db, `supportMessages/${chatSessionId}/messages`),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as ChatMessage));
        setMessages(messagesData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching messages:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch messages." });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, chatSessionId, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !currentUserId || isSending) return;
    setIsSending(true);

    const userMessagePayload: Omit<ChatMessage, 'id'> = {
      message: newMessage,
      senderId: currentUserId,
      senderRole: 'user',
      timestamp: serverTimestamp(),
    };
    
    setNewMessage("");

    try {
      const messagesRef = collection(db, `supportMessages/${chatSessionId}/messages`);
      const sessionRef = doc(db, "supportMessages", chatSessionId);

      await addDoc(messagesRef, userMessagePayload);
      await setDoc(sessionRef, { lastMessage: newMessage, lastUpdated: serverTimestamp(), status: 'waiting' }, { merge: true });

    } catch (error) {
      console.error("Error sending message:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
      setNewMessage(userMessagePayload.message); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTimestamp = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'p');
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none w-[90vw] sm:max-w-lg">
        <div className="flex flex-col h-[70vh]">
            <DialogHeader className="p-4 border-b">
                <DialogTitle className="flex items-center gap-2">
                    <LifeBuoy className="h-6 w-6 text-primary" />
                    Support Chat
                </DialogTitle>
                <DialogDescription>
                    Chatting about order #{orderId.substring(0, 6)}
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                        <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold">Support Agent</p>
                            <p className="text-sm">Hello! How can I help you with this order? An agent will be with you shortly.</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={cn("flex mb-3 items-end gap-2", msg.senderId === currentUserId ? "justify-end" : "justify-start")}>
                            {msg.senderId !== currentUserId && (
                                <Bot className="h-6 w-6 text-primary flex-shrink-0 self-start" />
                            )}
                            <div
                            className={cn(
                                "max-w-[80%] p-3 rounded-xl text-sm",
                                msg.senderId === currentUserId ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                            )}
                            >
                                <p>{msg.message}</p>
                                <p className={cn("text-xs mt-1", msg.senderId === currentUserId ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left")}>
                                    {formatMessageTimestamp(msg.timestamp)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </ScrollArea>
            <div className="p-4 border-t">
                <div className="w-full flex items-center gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === "Enter" && !isSending && handleSendMessage()}
                    disabled={isSending || isLoading}
                    className="flex-grow"
                />
                <Button onClick={handleSendMessage} size="icon" disabled={isSending || isLoading}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

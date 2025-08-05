
"use client";

import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Megaphone, Loader2 } from "lucide-react";

// This is a fixed ID for the single announcements channel document
const ANNOUNCEMENT_CHANNEL_ID = "main_announcements";

// A function to ensure the announcement channel document exists.
// In a real app, an admin tool would be used to create this.
const ensureChannelExists = async () => {
    const channelRef = doc(db, "announcements", ANNOUNCEMENT_CHANNEL_ID);
    try {
        const docSnap = await getDoc(channelRef);
        if (!docSnap.exists()) {
            await setDoc(channelRef, {
                channelName: "Main Announcements",
                createdAt: serverTimestamp(),
            });

            // Add a welcome message
            const messagesRef = collection(db, `announcements/${ANNOUNCEMENT_CHANNEL_ID}/messages`);
            await addDoc(messagesRef, {
                senderId: "system",
                senderName: "Velocity Support",
                message: "Welcome to the Community Announcements channel! Important updates and tips will be posted here.",
                timestamp: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error("Error ensuring announcement channel exists:", error);
    }
}


export function Announcements() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the channel document and a welcome message exist on first load.
    ensureChannelExists();

    setIsLoading(true);
    const messagesQuery = query(collection(db, `announcements/${ANNOUNCEMENT_CHANNEL_ID}/messages`), orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(messagesQuery, snapshot => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ChatMessage));
      setMessages(messagesData);
      setIsLoading(false);
    }, error => {
      console.error("Error fetching announcements:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch announcements." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
    }
  }, [messages]);

  const formatMessageTimestamp = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'MMM d, yyyy, p');
  }

  return (
    <Card className="h-full flex flex-col shadow-xl">
        <CardHeader className="border-b">
            <CardTitle className="flex items-center text-2xl font-bold text-primary">
                <Megaphone className="mr-3 h-6 w-6"/>
                Community & Announcements
            </CardTitle>
            <CardDescription>
                Updates, tips, and important information from the Velocity team.
            </CardDescription>
        </CardHeader>
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : messages.length === 0 ? (
             <div className="flex justify-center items-center h-full text-muted-foreground">
                <p>No announcements yet. Check back later!</p>
            </div>
        ) : (
            messages.map((msg) => (
                <div key={msg.id} className="flex mb-4 items-start gap-3">
                    <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {(msg.senderName || "A").substring(0,1)}
                        </AvatarFallback>
                    </Avatar>
                    <div
                        className={cn(
                            "max-w-[85%] p-3 rounded-xl text-sm bg-muted rounded-bl-none"
                        )}
                    >
                        <p className="font-semibold text-primary">{msg.senderName || "Admin"}</p>
                        <p className="mt-1">{msg.message}</p>
                        <p className="text-xs mt-2 text-muted-foreground text-left">
                            {formatMessageTimestamp(msg.timestamp)}
                        </p>
                    </div>
                </div>
            ))
        )}
        </ScrollArea>
        {/* No footer or input needed as this is a read-only view */}
    </Card>
  );
}

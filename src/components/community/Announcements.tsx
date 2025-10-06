
"use client";

import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, serverTimestamp, addDoc, limit } from "firebase/firestore";
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
    const messagesQuery = query(collection(db, `announcements/${ANNOUNCEMENT_CHANNEL_ID}/messages`), orderBy("timestamp", "desc"), limit(5));

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


  const formatMessageTimestamp = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'MMM d, p');
  }

  return (
    <Card className="h-full flex flex-col shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center">
                <Megaphone className="mr-2 h-5 w-5 text-primary"/>
                Announcements
            </CardTitle>
            <CardDescription>
                Updates from the Velocity team.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-4">
        {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : messages.length === 0 ? (
             <div className="flex justify-center items-center h-full text-muted-foreground">
                <p>No announcements yet.</p>
            </div>
        ) : (
             <div className="space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                {(msg.senderName || "A").substring(0,1)}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className="text-sm flex-grow"
                        >
                            <div className="flex justify-between items-baseline">
                                <p className="font-semibold text-primary">{msg.senderName || "Admin"}</p>
                                <p className="text-xs text-muted-foreground text-right">
                                    {formatMessageTimestamp(msg.timestamp)}
                                </p>
                            </div>
                            <p className="mt-0.5">{msg.message}</p>
                        </div>
                    </div>
                ))}
             </div>
        )}
        </CardContent>
    </Card>
  );
}

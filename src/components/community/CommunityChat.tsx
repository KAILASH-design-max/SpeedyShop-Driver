
"use client";

import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, serverTimestamp, addDoc, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { MessagesSquare, Loader2, Send } from "lucide-react";
import type { User } from 'firebase/auth';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const COMMUNITY_CHAT_ID = "global_community_chat";

export function CommunityChat() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [userName, setUserName] = useState("Driver");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || "Driver");
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const messagesQuery = query(
        collection(db, `communityChats/${COMMUNITY_CHAT_ID}/messages`), 
        orderBy("timestamp", "desc"),
        limit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, snapshot => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ChatMessage)).reverse();
      setMessages(messagesData);
      setIsLoading(false);
    }, error => {
      console.error("Error fetching community chat:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch community chat." });
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

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !currentUser || isSending) return;

    setIsSending(true);

    const messagePayload: Omit<ChatMessage, 'id'> = {
      message: newMessage,
      senderId: currentUser.uid,
      senderName: userName,
      senderRole: 'driver',
      timestamp: serverTimestamp(),
    };
    
    setNewMessage("");

    try {
      await addDoc(collection(db, `communityChats/${COMMUNITY_CHAT_ID}/messages`), messagePayload);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
      setNewMessage(messagePayload.message);
    } finally {
        setIsSending(false);
    }
  };

  const formatMessageTimestamp = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return formatDistanceToNow(date, { addSuffix: true, includeSeconds: true });
  }

  return (
    <Card className="h-[500px] flex flex-col shadow-none md:shadow-xl rounded-none md:rounded-lg border-x-0 md:border">
        <CardHeader className="border-b px-4 md:px-6">
            <CardTitle className="flex items-center text-2xl font-bold text-primary">
                <MessagesSquare className="mr-3 h-6 w-6"/>
                Live Community Chat
            </CardTitle>
            <CardDescription className="hidden md:block">
                Connect with fellow drivers. Share tips and ask questions.
            </CardDescription>
        </CardHeader>
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : messages.length === 0 ? (
             <div className="flex justify-center items-center h-full text-muted-foreground">
                <p>No messages yet. Be the first to start a conversation!</p>
            </div>
        ) : (
            messages.map((msg) => (
                <div key={msg.id} className={cn("flex mb-4 items-start gap-3", msg.senderId === currentUser?.uid ? "justify-end" : "justify-start")}>
                    {msg.senderId !== currentUser?.uid && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{(msg.senderName || "D").substring(0,1)}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn("max-w-[85%] p-3 rounded-xl text-sm", msg.senderId === currentUser?.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
                        <p className={cn("font-semibold", msg.senderId === currentUser?.uid ? "text-primary-foreground/80" : "text-primary")}>{msg.senderName || "Driver"}</p>
                        <p className="mt-1">{msg.message}</p>
                        <p className={cn("text-xs mt-2", msg.senderId === currentUser?.uid ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left")}>
                            {formatMessageTimestamp(msg.timestamp)}
                        </p>
                    </div>
                </div>
            ))
        )}
        </ScrollArea>
        <CardFooter className="p-4 border-t">
            <div className="w-full flex items-center gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message to the community..."
                    onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                    disabled={isSending || !currentUser}
                />
                <Button onClick={handleSendMessage} size="icon" disabled={isSending || !currentUser}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-5 w-5" />}
                </Button>
            </div>
        </CardFooter>
    </Card>
  );
}

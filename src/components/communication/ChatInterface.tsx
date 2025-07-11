
"use client";

import { useState, useEffect, useRef } from "react";
import type { CommunicationMessage, ChatThread } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, ArrowLeft, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PredefinedMessages } from "./PredefinedMessages";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

export function ChatInterface() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsLoadingThreads(true);
      const threadsQuery = query(collection(db, "chatThreads"), where("participantIds", "array-contains", currentUser.uid));
      
      const unsubscribe = onSnapshot(threadsQuery, snapshot => {
        const threadsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as ChatThread));
        setChatThreads(threadsData);
        setIsLoadingThreads(false);
      }, error => {
        console.error("Error fetching chat threads:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch chat threads." });
        setIsLoadingThreads(false);
      });

      return () => unsubscribe();
    } else {
      setChatThreads([]);
      setIsLoadingThreads(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (selectedThread && currentUser) {
      setIsLoadingMessages(true);
      const messagesQuery = query(collection(db, `chatThreads/${selectedThread.id}/messages`), orderBy("timestamp", "asc"));

      const unsubscribe = onSnapshot(messagesQuery, snapshot => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as CommunicationMessage));
        setMessages(messagesData);
        setIsLoadingMessages(false);
      }, error => {
        console.error("Error fetching messages:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch messages." });
        setIsLoadingMessages(false);
      });
      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [selectedThread, currentUser, toast]);

   useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSelectThread = (thread: ChatThread) => {
    setSelectedThread(thread);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedThread || !currentUser) return;

    const messagePayload = {
      senderId: currentUser.uid,
      content: newMessage,
      timestamp: serverTimestamp(),
    };
    
    setNewMessage("");

    try {
      // Add new message to subcollection
      await addDoc(collection(db, `chatThreads/${selectedThread.id}/messages`), messagePayload);
      
      // Update the last message on the parent thread document
      const threadRef = doc(db, "chatThreads", selectedThread.id);
      await updateDoc(threadRef, {
        lastMessage: newMessage,
        lastMessageTimestamp: serverTimestamp(),
      });

    } catch (error) {
      console.error("Error sending message:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
      setNewMessage(messagePayload.content); // Restore message on error
    }
  };

  const handleUsePredefinedMessage = (message: string) => {
    setNewMessage(prev => prev ? `${prev} ${message}`: message);
  };

  const getOtherParticipant = (thread: ChatThread, currentUserId: string) => {
    const otherId = thread.participantIds.find(id => id !== currentUserId) || "";
    return {
      id: otherId,
      name: thread.participantNames[otherId] || "Unknown User",
      avatarUrl: thread.participantAvatars[otherId] || `https://placehold.co/100x100.png`,
    };
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'p'); // e.g., 4:30 PM
  }

  if (selectedThread && currentUser) {
    const otherParticipant = getOtherParticipant(selectedThread, currentUser.uid);
    return (
      <Card className="w-full h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] flex flex-col shadow-xl">
        <CardHeader className="flex flex-row items-center gap-4 p-4 border-b">
            <Button variant="ghost" size="icon" onClick={() => setSelectedThread(null)} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} data-ai-hint="person avatar chat"/>
              <AvatarFallback>{otherParticipant.name.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-lg">{otherParticipant.name}</CardTitle>
                <CardDescription>Order #{selectedThread.id.substring(0,8)}</CardDescription>
            </div>
        </CardHeader>
        <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn("flex mb-3", msg.senderId === currentUser.uid ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[70%] p-3 rounded-xl text-sm",
                    msg.senderId === currentUser.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                  )}
                >
                  <p>{msg.content}</p>
                  <p className={cn("text-xs mt-1", msg.senderId === currentUser.uid ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left")}>
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
        <CardFooter className="p-4 border-t">
          <div className="w-full space-y-2">
            <PredefinedMessages onSelectMessage={handleUsePredefinedMessage} />
            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary"><MessageSquare className="mr-2 h-6 w-6"/>Chat Hub</CardTitle>
        <CardDescription>Select a conversation to start chatting.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingThreads ? (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading chats...</p>
            </div>
        ) : chatThreads.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">No active chats.</p>
        ) : (
            <div className="space-y-1">
                {chatThreads.map(thread => {
                    if (!currentUser) return null;
                    const otherParticipant = getOtherParticipant(thread, currentUser.uid);
                    return (
                        <div 
                            key={thread.id} 
                            onClick={() => handleSelectThread(thread)}
                            className="flex items-center p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) => e.key === 'Enter' && handleSelectThread(thread)}
                            aria-label={`Open chat with ${otherParticipant.name}`}
                        >
                            <Avatar className="mr-3 h-10 w-10">
                            <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} data-ai-hint="person avatar list" />
                            <AvatarFallback>{otherParticipant.name.substring(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                            <p className="font-semibold">{otherParticipant.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">{thread.lastMessage}</p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                                <p>{formatTimestamp(thread.lastMessageTimestamp)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </CardContent>
    </Card>
  );
}

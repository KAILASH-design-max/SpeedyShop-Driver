"use client";

import { useState, useEffect, useRef } from "react";
import type { ChatMessage, SupportChatSession } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, ArrowLeft, Loader2, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from 'date-fns';

interface AdminChatMessage extends ChatMessage {
  sender: 'user' | 'agent';
}

export function AdminChatHub() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [selectedSession, setSelectedSession] = useState<SupportChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<SupportChatSession[]>([]);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
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
      setIsLoadingSessions(true);
      const sessionsQuery = query(collection(db, "supportChats"), orderBy("createdAt", "desc"));
      
      const unsubscribe = onSnapshot(sessionsQuery, snapshot => {
        const sessionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as SupportChatSession));
        setChatSessions(sessionsData);
        setIsLoadingSessions(false);
      }, error => {
        console.error("Error fetching chat sessions:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch chat sessions." });
        setIsLoadingSessions(false);
      });

      return () => unsubscribe();
    } else {
      setChatSessions([]);
      setIsLoadingSessions(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (selectedSession && currentUser) {
      setIsLoadingMessages(true);
      const messagesQuery = query(collection(db, `supportChats/${selectedSession.id}/messages`), orderBy("timestamp", "asc"));

      const unsubscribe = onSnapshot(messagesQuery, snapshot => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as AdminChatMessage));
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
  }, [selectedSession, currentUser, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSelectSession = (session: SupportChatSession) => {
    setSelectedSession(session);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedSession || !currentUser || isSending) return;

    setIsSending(true);

    const messagePayload = {
      sender: 'agent',
      text: newMessage,
      timestamp: serverTimestamp(),
    };
    
    setNewMessage("");

    try {
      await addDoc(collection(db, `supportChats/${selectedSession.id}/messages`), messagePayload);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
      setNewMessage(messagePayload.text);
    } finally {
        setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  }
  
  const formatMessageTimestamp = (timestamp: any) => {
     if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'p');
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
        {/* Left Panel: Chat List */}
        <Card className="md:col-span-1 lg:col-span-1 h-full flex flex-col shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center text-2xl font-bold text-primary"><MessageSquare className="mr-2 h-6 w-6"/>Chat Hub</CardTitle>
                <CardDescription>Select a conversation to start chatting.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-2">
                <ScrollArea className="h-full">
                {isLoadingSessions ? (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : chatSessions.length === 0 ? (
                    <p className="text-center text-muted-foreground p-8">No active chats.</p>
                ) : (
                    <div className="space-y-1">
                        {chatSessions.map(session => (
                            <div 
                                key={session.id} 
                                onClick={() => handleSelectSession(session)}
                                className={cn(
                                    "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                                    selectedSession?.id === session.id ? "bg-muted" : "hover:bg-muted/50"
                                )}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && handleSelectSession(session)}
                                aria-label={`Open chat with ${session.userName}`}
                            >
                                <Avatar className="mr-3 h-10 w-10">
                                    <AvatarFallback>{session.userName?.substring(0,1).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-semibold truncate">{session.userName}</p>
                                    <p className="text-sm text-muted-foreground truncate">{session.lastMessage || `User ID: ${session.userId.substring(0,10)}...`}</p>
                                </div>
                                <div className="text-right text-xs text-muted-foreground flex-shrink-0 ml-2">
                                    <p>{formatTimestamp(session.createdAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </ScrollArea>
            </CardContent>
        </Card>

        {/* Right Panel: Chat Window */}
        <Card className="md:col-span-2 lg:col-span-3 w-full h-full flex flex-col shadow-xl">
        {selectedSession && currentUser ? (
            <>
                <CardHeader className="flex flex-row items-center gap-4 p-4 border-b">
                    <Avatar>
                      <AvatarImage src={undefined} alt={selectedSession.userName} />
                      <AvatarFallback>{selectedSession.userName?.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-lg">{selectedSession.userName}</CardTitle>
                        <CardDescription>User ID: {selectedSession.userId}</CardDescription>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
                {isLoadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    messages.map((msg) => (
                    <div key={msg.id} className={cn("flex mb-3", msg.sender === 'agent' ? "justify-end" : "justify-start")}>
                        <div
                        className={cn(
                            "max-w-[70%] p-3 rounded-xl text-sm",
                            msg.sender === 'agent' ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                        )}
                        >
                        <p>{msg.text}</p>
                        <p className={cn("text-xs mt-1", msg.sender === 'agent' ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left")}>
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
                        placeholder="Type your message..."
                        onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                        disabled={isSending}
                    />
                    <Button onClick={handleSendMessage} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSending}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-5 w-5" />}
                    </Button>
                    </div>
                </CardFooter>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold">Select a conversation</h3>
                <p>Choose a chat from the left panel to view messages and respond.</p>
            </div>
        )}
        </Card>

    </div>
  );
}

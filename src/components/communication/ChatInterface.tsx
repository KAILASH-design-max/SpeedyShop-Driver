
"use client";

import { useState, useEffect, useRef } from "react";
import type { CommunicationMessage, ChatThread, SupportChatSession } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, ArrowLeft, Loader2, LifeBuoy, User, Package } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PredefinedMessages } from "./PredefinedMessages";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from 'date-fns';
import { chat as callChatApi } from '@/ai/flows/chat-flow';
import type { ChatHistory } from '@/ai/flows/chat-flow';

type UnifiedChatThread = (ChatThread & { type: 'customer' }) | (SupportChatSession & { type: 'support' });

interface ChatInterfaceProps {
    preselectedThreadId?: string | null;
}

export function ChatInterface({ preselectedThreadId }: ChatInterfaceProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [selectedThread, setSelectedThread] = useState<UnifiedChatThread | null>(null);
  const [chatThreads, setChatThreads] = useState<UnifiedChatThread[]>([]);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [participantNames, setParticipantNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch and combine threads from both collections
  useEffect(() => {
    if (!currentUser) {
        setIsLoadingThreads(false);
        setChatThreads([]);
        return;
    }

    setIsLoadingThreads(true);
    
    // Listener for support chats
    const supportThreadsQuery = query(collection(db, "supportMessages"), where("userId", "==", currentUser.uid));
    const unsubscribeSupportChats = onSnapshot(snapshot => {
        const supportThreads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'support'
        } as UnifiedChatThread));
        
        supportThreads.sort((a, b) => {
            const tsA = a.lastUpdated;
            const tsB = b.lastUpdated;
            if (!tsA || !tsB || !tsA.seconds || !tsB.seconds) return 0;
            return tsB.seconds - tsA.seconds;
        });

        // Handle pre-selection
        if (preselectedThreadId) {
            const threadToSelect = supportThreads.find(t => t.id === preselectedThreadId);
            if (threadToSelect) {
                setSelectedThread(threadToSelect);
            }
        }
        
        setChatThreads(supportThreads);
        setIsLoadingThreads(false);
    }, error => {
        console.error("Error fetching support chat threads:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch support chats." });
        setIsLoadingThreads(false);
    });


    return () => {
        unsubscribeSupportChats();
    };

  }, [currentUser, toast, preselectedThreadId]);

  // Fetch messages for the selected thread
  useEffect(() => {
    if (selectedThread && currentUser) {
      setIsLoadingMessages(true);
      const isSupportChat = selectedThread.type === 'support';
      const collectionName = isSupportChat ? 'supportMessages' : 'Customer&deliveryboy';
      const messagesQuery = query(collection(db, `${collectionName}/${selectedThread.id}/messages`), orderBy("timestamp", "asc"));

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


  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedThread || !currentUser) return;
    setIsSending(true);

    const isSupportChat = selectedThread.type === 'support';
    const collectionName = isSupportChat ? 'supportMessages' : 'Customer&deliveryboy';
    const lastUpdatedField = isSupportChat ? 'lastUpdated' : 'lastMessageTimestamp';

    const messagePayload: Omit<CommunicationMessage, 'id'> = {
      senderId: currentUser.uid,
      message: newMessage,
      senderRole: 'driver',
      timestamp: serverTimestamp(),
    };
    
    setNewMessage("");

    try {
      // Add user's message to Firestore
      await addDoc(collection(db, `${collectionName}/${selectedThread.id}/messages`), messagePayload);
      
      const threadRef = doc(db, collectionName, selectedThread.id);
      await updateDoc(threadRef, {
        lastMessage: newMessage,
        [lastUpdatedField]: serverTimestamp(),
        status: 'active',
      });
      
      // If it's a support chat, call the AI flow
      if (isSupportChat) {
          const chatHistory: ChatHistory[] = messages.map(m => ({
            role: m.senderId === currentUser.uid ? 'user' : 'model',
            message: m.message,
          }));

          const orderIdForChat = selectedThread.orderId;

          const aiResponse = await callChatApi(chatHistory, newMessage, orderIdForChat);

          // Add AI's response to Firestore
          const aiMessagePayload: Omit<CommunicationMessage, 'id'> = {
              senderId: 'support-agent',
              message: aiResponse,
              senderRole: 'agent',
              timestamp: serverTimestamp(),
          };
          await addDoc(collection(db, `${collectionName}/${selectedThread.id}/messages`), aiMessagePayload);
          await updateDoc(threadRef, {
            lastMessage: aiResponse,
            [lastUpdatedField]: serverTimestamp(),
          });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
      setNewMessage(messagePayload.message); // Restore message on error
    } finally {
        setIsSending(false);
    }
  };
  
  const handleUsePredefinedMessage = (message: string) => {
    setNewMessage(prev => prev ? `${prev} ${message}`: message);
  };

  const getParticipantDetails = (thread: UnifiedChatThread, currentUserId: string) => {
    if (thread.type === 'support') {
        return {
            name: "Support Agent",
            avatarUrl: undefined, // No avatar for support
            subtext: thread.orderId ? `About Order #${thread.orderId.substring(0,6)}` : "General Support"
        }
    } else {
        const otherParticipantId = thread.participantIds.find(id => id !== currentUserId);
        const name = (otherParticipantId && participantNames[otherParticipantId]) || thread.participantNames?.[otherParticipantId || ''] || 'Customer';
        const avatarUrl = thread.participantAvatars?.[otherParticipantId || ''];
        return {
            name,
            avatarUrl,
            subtext: `Order #${thread.orderId?.substring(0, 6) || thread.id.substring(0,6)}`
        }
    }
  };

  const formatListTimestamp = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return "";
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, includeSeconds: true });
  }

  const formatMessageTimestamp = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'p');
  }

  const renderThreadList = () => (
    <Card className="md:col-span-1 lg:col-span-1 h-full flex flex-col shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-primary"><MessageSquare className="mr-2 h-6 w-6"/>Support Chat</CardTitle>
            <CardDescription>Your conversations with support.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-2">
            <ScrollArea className="h-full">
            {isLoadingThreads ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : chatThreads.length === 0 ? (
                <p className="text-center text-muted-foreground p-8">No support chats found.</p>
            ) : (
                <div className="space-y-1">
                    {chatThreads.map(thread => {
                        if (!currentUser) return null;
                        const details = getParticipantDetails(thread, currentUser.uid);
                        const isSelected = selectedThread?.id === thread.id;
                        const avatarFallbackChar = details.name.substring(0,1).toUpperCase();
                        const isSupport = thread.type === 'support';
                        return (
                             <div 
                                key={thread.id} 
                                onClick={() => setSelectedThread(thread)}
                                className={cn(
                                    "p-3 rounded-lg cursor-pointer transition-colors border border-transparent",
                                    isSelected ? "bg-muted border-primary/50" : "hover:bg-muted/50"
                                )}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && setSelectedThread(thread)}
                                aria-label={`Open chat with ${details.name}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10 border">
                                        {details.avatarUrl && <AvatarImage src={details.avatarUrl} alt={details.name} data-ai-hint="person avatar"/>}
                                        <AvatarFallback className={cn(isSupport && 'bg-blue-500 text-white')}>
                                            {isSupport ? <LifeBuoy size={20} /> : avatarFallbackChar}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold truncate">{details.name}</p>
                                            <p className="text-xs text-muted-foreground flex-shrink-0">{formatListTimestamp(thread.lastUpdated || (thread as ChatThread).lastMessageTimestamp)}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{thread.lastMessage || `New conversation...`}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            </ScrollArea>
        </CardContent>
    </Card>
  );

  const renderChatWindow = () => {
      if (!selectedThread || !currentUser) {
          return (
              <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold">Select a conversation</h3>
                <p>Choose a chat from the left panel to view messages.</p>
            </div>
          );
      }
      
      const details = getParticipantDetails(selectedThread, currentUser.uid);
      const isSupport = selectedThread.type === 'support';

      return (
        <Card className="w-full h-full flex flex-col shadow-xl">
            <CardHeader className="flex flex-row items-center gap-4 p-4 border-b">
                 <Button variant="ghost" size="icon" onClick={() => setSelectedThread(null)} className="mr-2 md:hidden">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar>
                    {details.avatarUrl && <AvatarImage src={details.avatarUrl} alt={details.name} />}
                    <AvatarFallback className={cn(isSupport && 'bg-blue-500 text-white')}>
                         {isSupport ? <LifeBuoy size={20} /> : <User size={20}/>}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-lg">{details.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                        {isSupport && selectedThread.orderId && <Package size={14}/>}
                        {details.subtext}
                    </CardDescription>
                </div>
            </CardHeader>
            <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
            {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                messages.map((msg) => (
                    <div key={msg.id} className={cn("flex mb-3 items-end gap-2", msg.senderId === currentUser.uid ? "justify-end" : "justify-start")}>
                        {msg.senderId !== currentUser.uid && (
                           <Avatar className="h-8 w-8">
                                <AvatarFallback className={cn(isSupport && 'bg-blue-500 text-white')}>
                                   {isSupport ? 'S' : details.name.substring(0,1).toUpperCase()}
                                </AvatarFallback>
                           </Avatar>
                        )}
                        <div
                        className={cn(
                            "max-w-[70%] p-3 rounded-xl text-sm",
                            msg.senderId === currentUser.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                        )}
                        >
                            <p>{msg.message}</p>
                            <p className={cn("text-xs mt-1", msg.senderId === currentUser.uid ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left")}>
                                {formatMessageTimestamp(msg.timestamp)}
                            </p>
                        </div>
                    </div>
                ))
            )}
            </ScrollArea>
            <CardFooter className="p-4 border-t">
            <div className="w-full space-y-2">
                <div className="flex items-center gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                    disabled={isSending}
                />
                <Button onClick={handleSendMessage} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSending}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
                </div>
                 {!isSupport && <PredefinedMessages onSelectMessage={handleUsePredefinedMessage}/>}
            </div>
            </CardFooter>
      </Card>
      );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
       <div className={cn("md:col-span-1 lg:col-span-1 h-full", selectedThread && "hidden md:block")}>
        {renderThreadList()}
       </div>
       <div className={cn("md:col-span-2 lg:col-span-3 h-full", !selectedThread && "hidden md:flex")}>
        {renderChatWindow()}
       </div>
    </div>
  );
}

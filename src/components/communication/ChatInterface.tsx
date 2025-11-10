
"use client";

import { useState, useEffect, useRef } from "react";
import type { CommunicationMessage, SupportChatSession, Profile } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, ArrowLeft, Loader2, LifeBuoy, Package } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PredefinedMessages } from "./PredefinedMessages";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from 'date-fns';
import { chat, type ChatHistory } from "@/ai/flows/chat-flow";

type UnifiedChatThread = SupportChatSession & { type: 'support' };

interface ChatInterfaceProps {
    preselectedThreadId?: string | null;
}


export function ChatInterface({ preselectedThreadId }: ChatInterfaceProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedThread, setSelectedThread] = useState<UnifiedChatThread | null>(null);
  const [chatThreads, setChatThreads] = useState<UnifiedChatThread[]>([]);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
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

  // Fetch user profile to get custom quick replies
   useEffect(() => {
    if (!currentUser) {
        setProfile(null);
        return;
    };
    const profileRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(profileRef, (doc) => {
        if(doc.exists()) {
            setProfile(doc.data() as Profile);
        }
    });
    return () => unsubscribe();
   }, [currentUser]);

  // Fetch only support threads
  useEffect(() => {
    if (!currentUser) {
        setIsLoadingThreads(false);
        setChatThreads([]);
        return;
    }

    setIsLoadingThreads(true);

    const supportThreadsQuery = query(
        collection(db, "supportMessages"), 
        where("userId", "==", currentUser.uid)
    );

    const unsubscribeSupportChats = onSnapshot(supportThreadsQuery, async (snapshot) => {
        const supportThreads: UnifiedChatThread[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as SupportChatSession),
            type: 'support'
        }));
        
        let finalThreads = [...supportThreads];

        // If a specific thread is requested (e.g. from an order) and it doesn't exist, create it.
        if (preselectedThreadId && !finalThreads.some(t => t.id === preselectedThreadId)) {
             const newThreadRef = doc(db, 'supportMessages', preselectedThreadId);
             const threadSnap = await getDoc(newThreadRef);

             if (!threadSnap.exists()) {
                 const newThreadData: Omit<SupportChatSession, 'id'> = {
                    orderId: preselectedThreadId,
                    userId: currentUser.uid,
                    createdAt: serverTimestamp(),
                    lastUpdated: serverTimestamp(),
                    status: 'active',
                    lastMessage: 'New chat about order started.',
                 };
                await setDoc(newThreadRef, newThreadData);
                finalThreads.unshift({ id: preselectedThreadId, ...newThreadData, type: 'support' });
             }
        }
        
        // If there are still no threads after checking, create a default one
        if (finalThreads.length === 0) {
            const defaultThreadId = `support_${currentUser.uid}`;
            const defaultThreadRef = doc(db, 'supportMessages', defaultThreadId);
            const defaultThreadSnap = await getDoc(defaultThreadRef);

            if (!defaultThreadSnap.exists()) {
                const newThreadData: Omit<SupportChatSession, 'id'> = {
                    userId: currentUser.uid,
                    createdAt: serverTimestamp(),
                    lastUpdated: serverTimestamp(),
                    status: 'active',
                    lastMessage: 'Welcome to support! How can we help?',
                };
                await setDoc(defaultThreadRef, newThreadData);
                finalThreads.push({ id: defaultThreadId, ...newThreadData, type: 'support' });
            }
        }


        finalThreads.sort((a, b) => {
            const tsA = a.lastUpdated;
            const tsB = b.lastUpdated;
            if (!tsA || !tsB || !tsA.seconds || !tsB.seconds) return 0;
            return tsB.seconds - tsA.seconds;
        });

        setChatThreads(finalThreads);

        if (preselectedThreadId) {
            const threadToSelect = finalThreads.find(t => t.id === preselectedThreadId);
            setSelectedThread(threadToSelect || null);
        } else if (finalThreads.length > 0 && !selectedThread) {
            // Automatically select the most recent thread if none is selected
            setSelectedThread(finalThreads[0]);
        }
        
        setIsLoadingThreads(false);
    }, error => {
        console.error("Error fetching support chat threads:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch support chats." });
        setIsLoadingThreads(false);
    });


    return () => {
        unsubscribeSupportChats();
    }

  }, [currentUser, toast, preselectedThreadId]);

  // Fetch messages for the selected thread
  useEffect(() => {
    if (selectedThread && currentUser) {
      setIsLoadingMessages(true);
      const collectionName = `supportMessages/${selectedThread.id}/messages`;
      const messagesQuery = query(collection(db, collectionName), orderBy("timestamp", "asc"));

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

    const collectionName = `supportMessages/${selectedThread.id}/messages`;
    const threadRef = doc(db, 'supportMessages', selectedThread.id);
    
    const userMessagePayload: Omit<CommunicationMessage, 'id'> = {
      senderId: currentUser.uid,
      message: newMessage,
      senderRole: 'driver',
      timestamp: serverTimestamp(),
    };
    
    const currentMessage = newMessage;
    setNewMessage("");

    try {
      await addDoc(collection(db, collectionName), userMessagePayload);
      await updateDoc(threadRef, {
        lastMessage: currentMessage,
        lastUpdated: serverTimestamp(),
        status: 'waiting', 
      });

      // Prepare history for AI
      const chatHistoryForAI: ChatHistory[] = messages.map(msg => ({
          role: msg.senderId === currentUser.uid ? 'user' : 'model',
          message: msg.message,
      }));

      // Call AI flow
      const aiResponse = await chat(chatHistoryForAI, currentMessage, selectedThread.orderId);

      // Save AI response to Firestore
       const aiMessagePayload: Omit<CommunicationMessage, 'id'> = {
        senderId: 'ai_support_agent',
        message: aiResponse,
        senderRole: 'agent',
        timestamp: serverTimestamp(),
      };
      await addDoc(collection(db, collectionName), aiMessagePayload);
      await updateDoc(threadRef, {
        lastMessage: aiResponse,
        lastUpdated: serverTimestamp(),
        status: 'active',
      });


    } catch (error) {
      console.error("Error sending message:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
      setNewMessage(currentMessage); // Restore message on error
    } finally {
        setIsSending(false);
    }
  };
  
  const handleUsePredefinedMessage = (message: string) => {
    setNewMessage(prev => prev ? `${prev} ${message}`: message);
  };

  const getParticipantDetails = (thread: UnifiedChatThread) => {
      return {
          name: "Support Agent",
          avatarUrl: undefined,
          subtext: thread.orderId ? `About Order #${thread.orderId}` : "General Support",
          Icon: LifeBuoy
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
            <CardDescription className="hidden md:block">Your conversations with our AI support.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-2">
            <ScrollArea className="h-full">
            {isLoadingThreads ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : chatThreads.length === 0 ? (
                <p className="text-center text-muted-foreground p-8">No chats found.</p>
            ) : (
                <div className="space-y-1">
                    {chatThreads.map(thread => {
                        if (!currentUser) return null;
                        const details = getParticipantDetails(thread);
                        const isSelected = selectedThread?.id === thread.id;
                        return (
                             <div 
                                key={thread.id} 
                                onClick={() => setSelectedThread(thread)}
                                className={cn(
                                    "p-3 rounded-lg cursor-pointer transition-colors border border-transparent",
                                    isSelected ? "bg-muted border-primary/50" : "hover:bg-muted"
                                )}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && setSelectedThread(thread)}
                                aria-label={`Open chat with ${details.name}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarFallback>
                                            <details.Icon size={20} />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold truncate">{details.name}</p>
                                            <p className="text-xs text-muted-foreground flex-shrink-0">{formatListTimestamp(thread.lastUpdated)}</p>
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
      
      const details = getParticipantDetails(selectedThread);

      return (
        <Card className="w-full h-full flex flex-col shadow-xl">
            <CardHeader className="flex flex-row items-center gap-4 p-4 border-b">
                 <Button variant="ghost" size="icon" onClick={() => setSelectedThread(null)} className="mr-2 md:hidden">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar>
                    <AvatarFallback>
                         <details.Icon size={20}/>
                    </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-lg">{details.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                        {selectedThread.orderId && <Package size={14}/>}
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
                                <AvatarFallback>
                                   {details.name.substring(0,1).toUpperCase()}
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
                 <PredefinedMessages 
                    customMessages={profile?.customQuickReplies}
                    onSelectMessage={handleUsePredefinedMessage}
                 />
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

    
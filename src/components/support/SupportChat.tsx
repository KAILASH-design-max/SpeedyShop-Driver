
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, User as UserIcon, MessageSquare, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, getDocs, limit, doc, setDoc, orderBy, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage } from "@/types";

export function SupportChat() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [chatSessionId, setChatSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
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
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        const findOrCreateSession = async () => {
            setIsLoading(true);
            const sessionsRef = collection(db, "supportChats");
            const q = query(sessionsRef, where("userId", "==", currentUser.uid), limit(1));
            
            try {
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const sessionDoc = querySnapshot.docs[0];
                    setChatSessionId(sessionDoc.id);
                } else {
                    const newSessionRef = doc(sessionsRef);
                    await setDoc(newSessionRef, {
                        userId: currentUser.uid,
                        createdAt: serverTimestamp(),
                        userName: currentUser.displayName || "Driver",
                        status: 'active',
                    });
                    setChatSessionId(newSessionRef.id);
                }
            } catch (error) {
                console.error("Error finding or creating chat session:", error);
                toast({ variant: "destructive", title: "Chat Error", description: "Could not initialize support chat." });
                setIsLoading(false);
            }
        };

        findOrCreateSession();

    }, [currentUser, toast]);

    useEffect(() => {
        if (!chatSessionId) return;

        const messagesRef = collection(db, `supportChats/${chatSessionId}/messages`);
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages: ChatMessage[] = [];
            snapshot.forEach(doc => {
                fetchedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            setMessages(fetchedMessages);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load messages."});
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [chatSessionId, toast]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (scrollViewport) {
              scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (newMessage.trim() === "" || !currentUser || !chatSessionId || isSending) return;

        setIsSending(true);
        const textToSend = newMessage;
        setNewMessage("");

        const messagePayload: Omit<ChatMessage, 'id'> = {
            message: textToSend,
            senderId: currentUser.uid,
            senderRole: 'user',
            timestamp: serverTimestamp(),
        };

        try {
            const messagesRef = collection(db, `supportChats/${chatSessionId}/messages`);
            await addDoc(messagesRef, messagePayload);

            // Update the last message on the parent session document
            const sessionRef = doc(db, "supportChats", chatSessionId);
            await updateDoc(sessionRef, {
                lastMessage: textToSend,
                lastMessageTimestamp: serverTimestamp(),
                status: 'active'
            });

        } catch (error) {
            console.error("Error sending message:", error);
            toast({ variant: "destructive", title: "Send Error", description: "Message could not be sent." });
            setNewMessage(textToSend); // Restore message on error
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="h-full flex flex-col shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-6 w-6 text-primary" /> Live Chat
                </CardTitle>
                <CardDescription>Connect with a support agent for immediate help.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <ScrollArea className="h-[400px] w-full pr-4" ref={scrollAreaRef}>
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <p className="ml-2 text-muted-foreground">Connecting to support chat...</p>
                            </div>
                        ) : messages.length === 0 ? (
                             <div className="flex justify-center items-center h-full">
                                <p className="text-muted-foreground">Send a message to start the conversation.</p>
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <div
                                    key={message.id || index}
                                    className={cn(
                                        "flex items-end gap-2",
                                        message.senderRole === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {message.senderRole === "agent" && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-muted-foreground text-white">S</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[75%] rounded-lg p-3 text-sm",
                                            message.senderRole === "user"
                                            ? "rounded-br-none bg-primary text-primary-foreground"
                                            : "rounded-bl-none bg-muted"
                                        )}
                                    >
                                        {message.message}
                                    </div>
                                    {message.senderRole === "user" && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary text-primary-foreground"><UserIcon size={16}/></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="border-t pt-6">
                <div className="flex w-full items-center space-x-2">
                    <Input 
                        type="text" 
                        placeholder="Type your message..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                        disabled={isLoading || isSending}
                    />
                    <Button type="submit" size="icon" onClick={handleSendMessage} disabled={isLoading || isSending}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

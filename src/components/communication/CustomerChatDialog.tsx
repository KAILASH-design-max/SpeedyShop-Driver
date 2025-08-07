
"use client";

import { useState, useEffect, useRef } from "react";
import type { CommunicationMessage, ChatThread } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Phone, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Order } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar } from "../ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";

interface CustomerChatDialogProps {
  order: Order;
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CustomerChatDialog({ order, children, open, onOpenChange }: CustomerChatDialogProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const ensureChatThreadExists = async (driver: FirebaseUser) => {
      const threadRef = doc(db, "Customer&deliveryboy", order.id);
      const threadSnap = await getDoc(threadRef);

      if (!threadSnap.exists()) {
          if (!order.userId || driver.uid === order.userId) {
              console.error("Cannot create chat thread: Invalid customer ID.");
              toast({ variant: "destructive", title: "Chat Error", description: "Could not initiate chat due to invalid participant IDs." });
              return;
          }

          const participantIds = [driver.uid, order.userId];
          
          await setDoc(threadRef, {
              participantIds: participantIds,
              participantNames: {
                  [driver.uid]: driver.displayName || "Driver",
                  [order.userId]: order.customerName || "Customer",
              },
              participantAvatars: {},
              lastMessage: `Conversation about order #${order.id.substring(0,6)} started.`,
              lastMessageTimestamp: serverTimestamp(),
              orderId: order.id,
          });
      }
  };

  useEffect(() => {
    if (!open || !currentUser) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    ensureChatThreadExists(currentUser);

    const messagesQuery = query(
      collection(db, `Customer&deliveryboy/${order.id}/messages`),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as CommunicationMessage)
        );
        setMessages(messagesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch messages.",
        });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [open, currentUser, order.id, toast]);

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

    const messagePayload: Omit<CommunicationMessage, "id"> = {
      senderId: currentUser.uid,
      message: newMessage,
      senderRole: "driver",
      timestamp: serverTimestamp(),
    };
    
    setNewMessage("");

    try {
      await addDoc(
        collection(db, `Customer&deliveryboy/${order.id}/messages`),
        messagePayload
      );
      const threadRef = doc(db, "Customer&deliveryboy", order.id);
      await updateDoc(threadRef, {
        lastMessage: newMessage,
        lastMessageTimestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send message.",
      });
      setNewMessage(messagePayload.message); // Restore message
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="p-0 border-none w-[90vw] sm:max-w-[425px] lg:max-w-lg">
        <div className="flex flex-col max-h-[90vh]">
          <DialogHeader className="py-4 px-1 border-b">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Customer Chat</DialogTitle>
                <DialogDescription>
                  Chatting about order #ORD{order.id.substring(0, 6).toUpperCase()}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" asChild>
                   <a href={`tel:${order.customerContact}`}>
                     <Phone className="h-5 w-5"/>
                   </a>
                 </Button>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-grow px-1 py-4" ref={scrollAreaRef}>
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                </div>
            ) : (
                messages.map((msg) => (
                    <div key={msg.id} className={cn("flex mb-3 items-end gap-2", msg.senderId === currentUser?.uid ? "justify-end" : "justify-start")}>
                        {msg.senderId !== currentUser?.uid && (
                           <Avatar className="h-8 w-8">
                                <AvatarFallback>C</AvatarFallback>
                           </Avatar>
                        )}
                        <div
                        className={cn(
                            "max-w-[80%] p-3 rounded-xl text-sm",
                            msg.senderId === currentUser?.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                        )}
                        >
                            <p>{msg.message}</p>
                            <p className={cn("text-xs mt-1", msg.senderId === currentUser?.uid ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left")}>
                                {formatMessageTimestamp(msg.timestamp)}
                            </p>
                        </div>
                    </div>
                ))
            )}
          </ScrollArea>
          <div className="border-t py-4 px-1">
            <div className="w-full flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === "Enter" && !isSending && handleSendMessage()}
                disabled={isSending}
                className="flex-grow"
              />
              <Button onClick={handleSendMessage} size="icon" disabled={isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

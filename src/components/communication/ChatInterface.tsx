
"use client";

import { useState } from "react";
import type { CommunicationMessage, ChatThread } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PredefinedMessages } from "./PredefinedMessages";
import { cn } from "@/lib/utils";

const mockChatThreads: ChatThread[] = [
  { id: "ORD789DEF", participantName: "Carol White (Order #789DEF)", lastMessage: "Okay, thank you!", lastMessageTimestamp: new Date(Date.now() - 5 * 60000).toISOString(), unreadCount: 0, avatarUrl: "https://placehold.co/100x100.png?text=CW" },
  { id: "SUPPORT001", participantName: "Velocity Support", lastMessage: "We are looking into it.", lastMessageTimestamp: new Date(Date.now() - 30 * 60000).toISOString(), unreadCount: 1, avatarUrl: "https://placehold.co/100x100.png?text=VS" },
];

const mockMessages: { [threadId: string]: CommunicationMessage[] } = {
  "ORD789DEF": [
    { id: "msg1", sender: "customer", content: "Hi, can you leave the package by the blue flower pot?", timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: "msg2", sender: "driver", content: "Sure, I can do that.", timestamp: new Date(Date.now() - 8 * 60000).toISOString() },
    { id: "msg3", sender: "customer", content: "Okay, thank you!", timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
  ],
  "SUPPORT001": [
    { id: "sup1", sender: "driver", content: "I'm having trouble with the app.", timestamp: new Date(Date.now() - 35 * 60000).toISOString() },
    { id: "sup2", sender: "support", content: "We are looking into it.", timestamp: new Date(Date.now() - 30 * 60000).toISOString(), isRead: false },
  ],
};


export function ChatInterface() {
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const handleSelectThread = (thread: ChatThread) => {
    setSelectedThread(thread);
    setMessages(mockMessages[thread.id] || []);
    // Mark messages as read (mock)
    mockMessages[thread.id]?.forEach(m => m.isRead = true);
    thread.unreadCount = 0;
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "" || !selectedThread) return;
    const message: CommunicationMessage = {
      id: `msg${Date.now()}`,
      sender: "driver",
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages([...messages, message]);
    // Update mock data
    mockMessages[selectedThread.id]?.push(message);
    selectedThread.lastMessage = newMessage;
    selectedThread.lastMessageTimestamp = new Date().toISOString();
    setNewMessage("");
  };

  const handleUsePredefinedMessage = (message: string) => {
    setNewMessage(prev => prev + message);
  };
  
  if (selectedThread) {
    return (
      <Card className="w-full h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] flex flex-col shadow-xl">
        <CardHeader className="flex flex-row items-center gap-4 p-4 border-b">
            <Button variant="ghost" size="icon" onClick={() => setSelectedThread(null)} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src={selectedThread.avatarUrl} alt={selectedThread.participantName} data-ai-hint="person avatar chat"/>
              <AvatarFallback>{selectedThread.participantName.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-lg">{selectedThread.participantName}</CardTitle>
                <CardDescription className="text-xs">Online</CardDescription> {/* Mock status */}
            </div>
        </CardHeader>
        <ScrollArea className="flex-grow p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex mb-3", msg.sender === "driver" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[70%] p-3 rounded-xl text-sm",
                  msg.sender === "driver" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                )}
              >
                <p>{msg.content}</p>
                <p className={cn("text-xs mt-1", msg.sender === "driver" ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left")}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
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
        {mockChatThreads.map(thread => (
          <div 
            key={thread.id} 
            onClick={() => handleSelectThread(thread)}
            className="flex items-center p-3 mb-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSelectThread(thread)}
            aria-label={`Open chat with ${thread.participantName}`}
          >
            <Avatar className="mr-3">
              <AvatarImage src={thread.avatarUrl} alt={thread.participantName} data-ai-hint="person avatar list" />
              <AvatarFallback>{thread.participantName.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-semibold">{thread.participantName}</p>
              <p className="text-sm text-muted-foreground truncate max-w-xs">{thread.lastMessage}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{new Date(thread.lastMessageTimestamp).toLocaleTimeString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              {thread.unreadCount > 0 && <span className="mt-1 inline-block bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">{thread.unreadCount}</span>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

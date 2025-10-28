
"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Notification } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from 'next/link';


export function NotificationBell() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setNotifications([]);
      return;
    }

    setLoading(true);
    // Query without composite index. We will sort on the client.
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      limit(50) // Fetch a bit more to ensure we get recent ones, then sort.
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      let fetchedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      
      // Sort on the client
      fetchedNotifications.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return dateB - dateA;
      });

      // Limit to the most recent 20 after sorting
      fetchedNotifications = fetchedNotifications.slice(0, 20);
      
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleMarkAsRead = async (notificationId: string) => {
    const notificationRef = doc(db, "notifications", notificationId);
    try {
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    const unreadNotifications = notifications.filter(n => !n.read);
    const promises = unreadNotifications.map(n => {
        const notificationRef = doc(db, "notifications", n.id);
        return updateDoc(notificationRef, { read: true });
    });
    
    try {
        await Promise.all(promises);
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
    }
  }
  
  const NotificationLink = ({ notification, children }: { notification: Notification, children: React.ReactNode }) => {
    const content = (
      <div
        className={cn(
            "p-3 rounded-md transition-colors hover:bg-muted/50",
            !notification.read && "bg-primary/10"
        )}
        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
        >
        {children}
      </div>
    );
  
    if (notification.link) {
      return <Link href={notification.link}>{content}</Link>;
    }
  
    return content;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <CardTitle className="text-lg">Notifications</CardTitle>
             {unreadCount > 0 && (
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleMarkAllAsRead}>
                    Mark all as read
                </Button>
             )}
          </CardHeader>
          <CardContent className="p-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-muted-foreground p-8">
                <Inbox className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm">You have no notifications.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <NotificationLink key={notification.id} notification={notification}>
                    <div className="flex items-start gap-3">
                        {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        )}
                        <div className={cn("flex-grow", notification.read && "pl-5")}>
                            <p className="font-semibold text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : ''}
                            </p>
                        </div>
                    </div>
                  </NotificationLink>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

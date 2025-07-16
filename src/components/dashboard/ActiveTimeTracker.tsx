
"use client";

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Clock, Loader2 } from 'lucide-react';

const formatDuration = (totalSeconds: number) => {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// Use UTC to match the session manager and avoid timezone issues.
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = today.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function ActiveTimeTracker() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [baseSeconds, setBaseSeconds] = useState(0);
  const [currentSessionStart, setCurrentSessionStart] = useState<number | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setIsLoaded(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
        setIsLoaded(false);
        return;
    }

    const todayStr = getTodayDateString();
    const sessionsQuery = query(
      collection(db, "sessions"),
      where("userId", "==", currentUser.uid),
      where("date", "==", todayStr)
    );

    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      let accumulatedSeconds = 0;
      let activeSessionLoginTime: Timestamp | null = null;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const loginTime = data.loginTimestamp as Timestamp;
        const logoutTime = data.logoutTimestamp as Timestamp;

        if (loginTime && logoutTime) {
          accumulatedSeconds += (logoutTime.seconds - loginTime.seconds);
        } else if (loginTime && !logoutTime) {
          activeSessionLoginTime = loginTime;
        }
      });
      
      setBaseSeconds(accumulatedSeconds);
      setCurrentSessionStart(activeSessionLoginTime ? activeSessionLoginTime.seconds : null);
      setIsLoaded(true);
    }, (error) => {
        console.error("Error in ActiveTimeTracker snapshot listener:", error);
        setIsLoaded(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    // Initial display update
    if (currentSessionStart) {
        const now = Math.floor(Date.now() / 1000);
        const currentDuration = now - currentSessionStart;
        setDisplaySeconds(baseSeconds + currentDuration);
    } else {
        setDisplaySeconds(baseSeconds);
    }

    // Set up interval to update timer
    const timer = setInterval(() => {
        if (currentSessionStart) {
            const now = Math.floor(Date.now() / 1000);
            const currentDuration = now - currentSessionStart;
            setDisplaySeconds(baseSeconds + currentDuration);
        } else {
            setDisplaySeconds(baseSeconds);
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [baseSeconds, currentSessionStart, isLoaded]);

  if (!currentUser) {
    return null;
  }
  
  if (!isLoaded) {
    return (
        <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
       <Clock className="h-5 w-5 text-primary" />
       <p className="text-base font-semibold text-primary">
           {formatDuration(displaySeconds)}
       </p>
    </div>
  );
}

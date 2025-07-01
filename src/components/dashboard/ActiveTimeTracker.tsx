
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { Clock } from 'lucide-react';

interface ActiveTimeTrackerProps {
  userId: string;
}

const formatDuration = (totalSeconds: number) => {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function ActiveTimeTracker({ userId }: ActiveTimeTrackerProps) {
  const [baseSeconds, setBaseSeconds] = useState(0);
  const [currentSessionStart, setCurrentSessionStart] = useState<number | null>(null); // Unix timestamp in seconds
  const [displaySeconds, setDisplaySeconds] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const todayStr = getTodayDateString();
    const sessionsQuery = query(
      collection(db, "sessions"),
      where("userId", "==", userId),
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
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
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
  }, [baseSeconds, currentSessionStart]);


  return (
    <div className="flex items-center gap-2">
       <Clock className="h-5 w-5 text-primary" />
       <p className="text-base font-semibold text-primary">
           {formatDuration(displaySeconds)}
       </p>
    </div>
  );
}

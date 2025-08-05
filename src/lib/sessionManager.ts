
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

// Use UTC to avoid timezone issues where the date might change overnight during a session.
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = today.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export const startSession = async (userId: string) => {
    if (!userId) return;
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    
    // Avoid creating new session if one is already active in this tab
    if (sessionStorage.getItem('active_session_id')) return;
    
    try {
        const sessionData = {
            userId: userId,
            loginTimestamp: serverTimestamp(),
            logoutTimestamp: null,
            date: getTodayDateString(),
            userAgent: navigator.userAgent, // Store user agent
            location: "Unknown", // Placeholder for location
        };
        const docRef = await addDoc(collection(db, "sessions"), sessionData);
        sessionStorage.setItem('active_session_id', docRef.id);
    } catch (error) {
        console.error("Error starting session:", error);
    }
};

export const endSession = async () => {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    const sessionId = sessionStorage.getItem('active_session_id');
    if (!sessionId) return;
    
    try {
        const sessionRef = doc(db, "sessions", sessionId);
        await updateDoc(sessionRef, {
            logoutTimestamp: serverTimestamp()
        });
        sessionStorage.removeItem('active_session_id');
    } catch (error) {
        console.error("Error ending session:", error);
    }
};

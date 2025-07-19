
"use client";

import { ChatInterface } from "@/components/communication/ChatInterface";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { useEffect } from "react";

// This component now acts as a wrapper to ensure a support chat session exists
// and then renders the main ChatInterface.
export function SupportChat() {
    const { toast } = useToast();

    useEffect(() => {
        const ensureSupportSessionExists = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const sessionsRef = collection(db, "supportChats");
            const q = query(sessionsRef, where("userId", "==", currentUser.uid), limit(1));
            
            try {
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    // No session exists, create one
                    const newSessionRef = doc(sessionsRef);
                    await setDoc(newSessionRef, {
                        userId: currentUser.uid,
                        userName: currentUser.displayName || "Driver",
                        status: 'active',
                        createdAt: serverTimestamp(),
                        lastUpdated: serverTimestamp(),
                        lastMessage: "New support session started."
                    });
                    toast({ title: "Support Chat Created", description: "You can now chat with a support agent." });
                }
            } catch (error) {
                console.error("Error ensuring support chat session:", error);
                toast({ variant: "destructive", title: "Chat Error", description: "Could not initialize support chat." });
            }
        };

        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                ensureSupportSessionExists();
            }
        });
        
        return () => unsubscribe();
    }, [toast]);

    return (
       <div className="h-full">
         <ChatInterface />
       </div>
    );
}

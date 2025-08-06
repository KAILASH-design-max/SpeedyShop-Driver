
"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/types";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { PenaltyManagement } from "@/components/profile/PenaltyManagement";

export default function PenaltiesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      const profileRef = doc(db, "users", currentUser.uid);
      const unsubscribeProfile = onSnapshot(
        profileRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as Profile);
          } else {
            toast({ variant: "destructive", title: "Error", description: "Profile not found." });
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching profile:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load penalty data." });
          setLoading(false);
        }
      );
      return () => unsubscribeProfile();
    }
  }, [currentUser, toast]);
  
  const handleAppealSubmit = async (penaltyId: string, appealComment: string) => {
    if (!currentUser || !profile) return;
    const profileRef = doc(db, "users", currentUser.uid);
    
    const penaltyToUpdate = profile.penalties?.find(p => p.id === penaltyId);
    if (!penaltyToUpdate) {
        toast({ variant: "destructive", title: "Error", description: "Penalty not found." });
        return;
    }
    
    try {
        const updatedPenalty = {
            ...penaltyToUpdate,
            status: 'Appealed',
            appealComment: appealComment,
            appealDate: serverTimestamp(),
        };

        // Atomically remove the old penalty and add the updated one.
        await updateDoc(profileRef, {
            penalties: arrayRemove(penaltyToUpdate)
        });
        await updateDoc(profileRef, {
            penalties: arrayUnion(updatedPenalty)
        });

        toast({
            title: "Appeal Submitted",
            description: "Your appeal has been submitted for review.",
            className: "bg-green-500 text-white"
        });
    } catch (error) {
        console.error("Error submitting appeal:", error);
        toast({ variant: "destructive", title: "Appeal Failed", description: "Could not submit your appeal." });
    }
  };

  if (loading || !profile || !currentUser) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading penalty data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <PenaltyManagement profile={profile} onAppealSubmit={handleAppealSubmit} />
    </div>
  );
}

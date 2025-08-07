
"use client";

import { useEffect, useState } from "react";
import { PerformanceMetrics } from "@/components/profile/PerformanceMetrics";
import type { Profile } from "@/types";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";

export default function RatingsPage() {
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
          toast({ variant: "destructive", title: "Error", description: "Could not load ratings data." });
          setLoading(false);
        }
      );
      return () => unsubscribeProfile();
    }
  }, [currentUser, toast]);

  if (loading || !profile || !currentUser) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading ratings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1 py-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <PerformanceMetrics profile={profile} />
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import type { Profile } from "@/types";
import { PaymentSettings } from "@/components/settings/PaymentSettings";

export default function PaymentSettingsPage() {
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
          toast({ variant: "destructive", title: "Error", description: "Could not load profile data." });
          setLoading(false);
        }
      );
      return () => unsubscribeProfile();
    }
  }, [currentUser, toast]);

  const handleUpdate = async (updatedData: Record<string, any>) => {
    if (!currentUser) return;
    const profileRef = doc(db, "users", currentUser.uid);
    try {
      const dataWithTimestamp = {
        ...updatedData,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(profileRef, dataWithTimestamp);
      toast({
        title: "Payment Settings Updated",
        description: "Your changes have been saved successfully.",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Error updating payment settings:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save your changes.",
      });
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading Payment Settings...</p>
      </div>
    );
  }

  return (
    <div className="md:p-6 space-y-6">
      <div className="hidden md:block">
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
        </Button>
      </div>
      <PaymentSettings profile={profile} onUpdate={handleUpdate} />
    </div>
  );
}


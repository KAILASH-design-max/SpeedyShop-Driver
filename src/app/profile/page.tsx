
"use client";

import { useEffect, useState } from "react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { DocumentManagement } from "@/components/profile/DocumentManagement";
import { PerformanceMetrics } from "@/components/profile/PerformanceMetrics";
import type { Profile } from "@/types";
import { Separator } from "@/components/ui/separator";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";

export default function ProfilePage() {
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
        router.push("/"); // Redirect to login if not authenticated
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      const profileRef = doc(db, "deliveryPartners", currentUser.uid);
      const unsubscribeProfile = onSnapshot(
        profileRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as Profile);
          } else {
            // This case might happen if signup didn't complete, or data was deleted.
            // For robustness, one might create a default profile structure here.
            // For now, we assume signup creates the basic structure.
            toast({ variant: "destructive", title: "Profile Not Found", description: "Could not load your profile data." });
            // Initialize a default structure if it's missing to prevent errors
             const defaultProfile: Profile = {
                uid: currentUser.uid,
                email: currentUser.email || "",
                fullName: currentUser.displayName || "",
                phone: "",
                vehicleDetails: "",
                bankAccountNumber: "",
                profilePictureUrl: "",
                documents: {
                    driverLicenseUrl: "",
                    vehicleRegistrationUrl: "",
                    proofOfInsuranceUrl: "",
                },
                createdAt: new Date().toISOString(),
             };
             setProfile(defaultProfile);
             // Optionally, write this default to Firestore
             // setDoc(profileRef, defaultProfile).catch(err => console.error("Error creating default profile", err));
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching profile:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load profile." });
          setLoading(false);
        }
      );
      return () => unsubscribeProfile();
    } else {
      setLoading(true); // Keep loading if no current user yet
    }
  }, [currentUser, toast]);

  const handleProfileUpdate = async (updatedData: Partial<Profile>) => {
    if (!currentUser) return;
    const profileRef = doc(db, "deliveryPartners", currentUser.uid);
    try {
      await updateDoc(profileRef, updatedData);
      toast({ title: "Profile Updated", description: "Your changes have been saved.", className: "bg-green-500 text-white" });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save your changes." });
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <ProfileForm profile={profile} onUpdate={handleProfileUpdate} />
      <Separator />
      {/* Ensure PerformanceMetrics receives the necessary fields from the profile state */}
      <PerformanceMetrics 
        profile={{
          ...profile,
          averageDeliveryTime: profile.averageDeliveryTime ?? 0,
          onTimeDeliveryRate: profile.onTimeDeliveryRate ?? 0,
          totalDeliveries: profile.totalDeliveries ?? 0,
          overallRating: profile.overallRating ?? 0,
        }} 
      />
      <Separator />
      <DocumentManagement profile={profile} onUpdate={handleProfileUpdate} />
    </div>
  );
}

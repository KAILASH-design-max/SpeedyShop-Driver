
"use client";

import { useEffect, useState } from "react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { DocumentManagement } from "@/components/profile/DocumentManagement";
import type { Profile } from "@/types";
import { Separator } from "@/components/ui/separator";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp, arrayUnion, collection, arrayRemove } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { VehicleMaintenanceLog } from "@/components/profile/VehicleMaintenanceLog";
import { LeaveManagement } from "@/components/profile/LeaveManagement";
import { PenaltyManagement } from "@/components/profile/PenaltyManagement";

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
             const defaultProfile: Profile = {
                uid: currentUser.uid,
                email: currentUser.email || "",
                name: currentUser.displayName || "",
                phoneNumber: "",
                role: "deliveryPartner",
                vehicleDetails: "",
                vehicleType: 'bike',
                vehicleRegistrationNumber: '',
                verificationStatus: 'pending',
                profilePictureUrl: "",
                documents: {
                    driverLicense: undefined,
                    vehicleRegistration: undefined,
                    proofOfInsurance: undefined,
                },
                bankDetails: {
                  accountHolderName: "",
                  accountNumber: "",
                  ifscCode: "",
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
             };
             setProfile(defaultProfile);
             setDoc(profileRef, defaultProfile).catch(err => console.error("Error creating default profile", err));
             toast({ title: "Profile Initialized", description: "Your profile has been initialized. Please complete your details." });
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
      setLoading(true); 
    }
  }, [currentUser, toast]);

  const handleProfileUpdate = async (updatedData: Partial<Profile> | Record<string,any>) => {
    if (!currentUser || !profile) return;
    const profileRef = doc(db, "users", currentUser.uid); 
    try {
      // Handle server timestamps for nested document uploads
      if (updatedData.documents) {
        const docKey = Object.keys(updatedData.documents)[0];
        if (docKey && updatedData.documents[docKey].uploadedAt) {
            updatedData.documents[docKey].uploadedAt = serverTimestamp();
        }
      }

      const dataWithTimestamp = {
        ...updatedData,
        updatedAt: serverTimestamp(),
      };
      
      if (updatedData.newMaintenanceLog) {
        const newLogWithTimestamp = {
          ...updatedData.newMaintenanceLog,
          id: doc(collection(db, 'id-generator')).id, // Generate a unique ID for the log entry
          date: serverTimestamp(),
        };
        delete dataWithTimestamp.newMaintenanceLog;
        await updateDoc(profileRef, {
            ...dataWithTimestamp,
            maintenanceLog: arrayUnion(newLogWithTimestamp),
        });
      } else if (updatedData.newLeaveRequest) {
        const newLeaveRequestWithTimestamp = {
          ...updatedData.newLeaveRequest,
          id: doc(collection(db, 'id-generator')).id,
          createdAt: serverTimestamp(),
          status: 'pending',
        };
        delete dataWithTimestamp.newLeaveRequest;
        await updateDoc(profileRef, {
            ...dataWithTimestamp,
            leaveRequests: arrayUnion(newLeaveRequestWithTimestamp),
        });
      } else if (updatedData.newPenaltyAppeal) {
        const { penaltyId, appealComment } = updatedData.newPenaltyAppeal;
        const penaltyToUpdate = profile.penalties?.find(p => p.id === penaltyId);
        
        if (penaltyToUpdate) {
            const updatedPenalty = {
                ...penaltyToUpdate,
                status: 'Appealed',
                appealComment: appealComment,
                appealDate: serverTimestamp(),
            };
            // Remove the old penalty and add the updated one
            await updateDoc(profileRef, {
                penalties: arrayRemove(penaltyToUpdate)
            });
            await updateDoc(profileRef, {
                penalties: arrayUnion(updatedPenalty)
            });
        }
      }
      else {
        await setDoc(profileRef, dataWithTimestamp, { merge: true });
      }


      toast({ title: "Profile Updated", description: "Your changes have been saved.", className: "bg-green-500 text-white" });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save your changes." });
    }
  };

  if (loading || !profile || !currentUser) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-4 md:px-8 md:py-6 space-y-8">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/ratings')}>
          <Star className="mr-2 h-4 w-4" />
          View My Ratings
        </Button>
        <Button variant="destructive" onClick={() => router.push('/penalties')}>
          <ShieldX className="mr-2 h-4 w-4" />
          View Penalties
        </Button>
      </div>
      <ProfileForm profile={profile} onUpdate={handleProfileUpdate} />
      <Separator />
      <DocumentManagement profile={profile} onUpdate={handleProfileUpdate} />
      <Separator />
      <VehicleMaintenanceLog profile={profile} onUpdate={handleProfileUpdate} />
      <Separator />
      <LeaveManagement profile={profile} onUpdate={handleProfileUpdate} />
    </div>
  );
}

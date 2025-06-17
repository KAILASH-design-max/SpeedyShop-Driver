
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Car, CreditCard, Save, Image as ImageIcon, Loader2 } from "lucide-react";
import type { Profile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional(), // Email might not be editable
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  vehicleDetails: z.string().min(5, { message: "Vehicle details are required." }),
  bankAccountNumber: z.string().min(8, {message: "Bank account number is required."}),
});

interface ProfileFormProps {
  profile: Profile;
  onUpdate: (data: Partial<Profile>) => Promise<void>;
}

export function ProfileForm({ profile, onUpdate }: ProfileFormProps) {
  const { toast } = useToast();
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(profile.profilePictureUrl || null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: profile.fullName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      vehicleDetails: profile.vehicleDetails || "",
      bankAccountNumber: profile.bankAccountNumber || "",
    },
  });

  useEffect(() => {
    form.reset({
      fullName: profile.fullName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      vehicleDetails: profile.vehicleDetails || "",
      bankAccountNumber: profile.bankAccountNumber || "",
    });
    setProfilePicturePreview(profile.profilePictureUrl || null);
  }, [profile, form]);


  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsSaving(true);
    await onUpdate(values);
    setIsSaving(false);
  }

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!profile.uid) {
        toast({ variant: "destructive", title: "Error", description: "User ID not found. Cannot upload picture." });
        return;
      }
      setIsUploadingPicture(true);
      const pictureStorageRef = storageRef(storage, `profilePictures/${profile.uid}/${file.name}`);
      try {
        const snapshot = await uploadBytes(pictureStorageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        setProfilePicturePreview(downloadURL);
        await onUpdate({ profilePictureUrl: downloadURL });
        toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." });
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload profile picture." });
      } finally {
        setIsUploadingPicture(false);
      }
    }
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarImage src={profilePicturePreview || "https://placehold.co/150x150.png"} alt={profile.fullName} data-ai-hint="person face" />
                  <AvatarFallback>{profile.fullName?.substring(0,2).toUpperCase() || "JD"}</AvatarFallback>
              </Avatar>
              {isUploadingPicture && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
            <div>
                <CardTitle className="text-2xl font-bold text-primary">{profile.fullName || "Driver Name"}</CardTitle>
                <CardDescription>Manage your personal information and settings.</CardDescription>
                 <Label htmlFor="profile-picture-upload" className="mt-2 inline-flex items-center text-sm text-primary hover:underline cursor-pointer">
                    <ImageIcon className="mr-1 h-4 w-4" /> Change Profile Picture
                </Label>
                <Input id="profile-picture-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} disabled={isUploadingPicture} />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSaving}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>Email Address</FormLabel>
                  <FormControl>
                    <Input {...field} disabled /> 
                  </FormControl>
                  <FormDescription>Email address cannot be changed.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground"/>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} disabled={isSaving}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicleDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-muted-foreground"/>Vehicle Details</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Honda Activa - MH01AB1234" {...field} disabled={isSaving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><CreditCard className="mr-2 h-4 w-4 text-muted-foreground"/>Bank Account (for Payouts)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your bank account number" {...field} disabled={isSaving} />
                  </FormControl>
                  <FormDescription>Ensure this is accurate for receiving payouts.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving || isUploadingPicture}>
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5"/>}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

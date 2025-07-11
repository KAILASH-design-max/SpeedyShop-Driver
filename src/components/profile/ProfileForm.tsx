
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
import { User, Mail, Phone, Car, Save, Image as ImageIcon, Loader2, Banknote, ShieldCheck, Bike } from "lucide-react";
import type { Profile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from "firebase/storage";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";


const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional(),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  
  vehicleType: z.enum(["bike", "scooter", "car"]),
  vehicleRegistrationNumber: z.string().min(2, { message: "Vehicle registration number is required." }),
  drivingLicenseNumber: z.string().optional(),

  bankDetails: z.object({
    accountHolderName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
  }).optional(),
});

interface ProfileFormProps {
  profile: Profile;
  onUpdate: (data: Partial<Profile> | Record<string,any>) => Promise<void>;
}

export function ProfileForm({ profile, onUpdate }: ProfileFormProps) {
  const { toast } = useToast();
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(profile.profilePictureUrl || null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [pictureUploadProgress, setPictureUploadProgress] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile.name || "",
      email: profile.email || "",
      phoneNumber: profile.phoneNumber || "",
      vehicleType: profile.vehicleType || "bike",
      vehicleRegistrationNumber: profile.vehicleRegistrationNumber || "",
      drivingLicenseNumber: profile.drivingLicenseNumber || "",
      bankDetails: {
        accountHolderName: profile.bankDetails?.accountHolderName || "",
        accountNumber: profile.bankDetails?.accountNumber || "",
        ifscCode: profile.bankDetails?.ifscCode || "",
      }
    },
  });

  useEffect(() => {
    form.reset({
      name: profile.name || "",
      email: profile.email || "",
      phoneNumber: profile.phoneNumber || "",
      vehicleType: profile.vehicleType || "bike",
      vehicleRegistrationNumber: profile.vehicleRegistrationNumber || "",
      drivingLicenseNumber: profile.drivingLicenseNumber || "",
      bankDetails: {
        accountHolderName: profile.bankDetails?.accountHolderName || "",
        accountNumber: profile.bankDetails?.accountNumber || "",
        ifscCode: profile.bankDetails?.ifscCode || "",
      }
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
      setPictureUploadProgress(0);
      const pictureStorageRef = storageRef(storage, `profilePictures/${profile.uid}/${file.name}`);
      
      const uploadTask = uploadBytesResumable(pictureStorageRef, file);

      uploadTask.on('state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setPictureUploadProgress(progress);
        },
        (error) => {
          console.error("Error uploading profile picture:", error);
          toast({ variant: "destructive", title: "Upload Failed", description: `Could not upload profile picture. ${error.message}` });
          setIsUploadingPicture(false);
          setPictureUploadProgress(0);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setProfilePicturePreview(downloadURL);
            await onUpdate({ profilePictureUrl: downloadURL });
            toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." });
          } catch (error) {
            console.error("Error finalizing profile picture upload:", error);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not save new profile picture." });
          } finally {
            setIsUploadingPicture(false);
            setPictureUploadProgress(0);
          }
        }
      );
    }
  };

  const getVerificationBadgeVariant = (status?: string) => {
    switch(status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  }


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarImage src={profilePicturePreview || "https://placehold.co/150x150.png"} alt={profile.name} data-ai-hint="person face" />
                  <AvatarFallback>{profile.name?.substring(0,2).toUpperCase() || "JD"}</AvatarFallback>
              </Avatar>
              {isUploadingPicture && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex-grow">
                <CardTitle className="text-2xl font-bold text-primary">{profile.name || "Driver Name"}</CardTitle>
                <CardDescription>Role: {profile.role || 'N/A'}</CardDescription>
                <div className="mt-2 flex items-center gap-4">
                  <Label htmlFor="profile-picture-upload" className="inline-flex items-center text-sm text-primary hover:underline cursor-pointer">
                      <ImageIcon className="mr-1 h-4 w-4" /> Change Profile Picture
                  </Label>
                  <Badge variant={getVerificationBadgeVariant(profile.verificationStatus)} className="capitalize">
                      <ShieldCheck className="mr-1 h-3.5 w-3.5"/>
                      {profile.verificationStatus || 'N/A'}
                  </Badge>
                </div>
                <Input id="profile-picture-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} disabled={isUploadingPicture || isSaving} />
                 {isUploadingPicture && pictureUploadProgress > 0 && (
                    <Progress value={pictureUploadProgress} className="w-full h-1.5 mt-2" />
                 )}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardTitle className="text-xl font-semibold text-primary border-b pb-2">Personal Information</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSaving || isUploadingPicture}/>
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
                name="phoneNumber" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground"/>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} disabled={isSaving || isUploadingPicture}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator className="my-6"/>

            <CardTitle className="text-xl font-semibold text-primary border-b pb-2">Vehicle & License Details</CardTitle>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Bike className="mr-2 h-4 w-4 text-muted-foreground"/>Vehicle Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving || isUploadingPicture}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bike">Bike</SelectItem>
                        <SelectItem value="scooter">Scooter</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="vehicleRegistrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-muted-foreground"/>Vehicle Registration No.</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., MH01AB1234" {...field} disabled={isSaving || isUploadingPicture}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="drivingLicenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-muted-foreground"/>Driving License No.</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your driving license number" {...field} disabled={isSaving || isUploadingPicture}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-6"/>

            <CardTitle className="text-xl font-semibold text-primary border-b pb-2">Bank Details</CardTitle>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="bankDetails.accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/>Account Holder Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name as per bank records" {...field} disabled={isSaving || isUploadingPicture}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankDetails.accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Banknote className="mr-2 h-4 w-4 text-muted-foreground"/>Bank Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account number" {...field} disabled={isSaving || isUploadingPicture}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankDetails.ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Banknote className="mr-2 h-4 w-4 text-muted-foreground"/>IFSC Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter IFSC code" {...field} disabled={isSaving || isUploadingPicture}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving || isUploadingPicture}>
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5"/>}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

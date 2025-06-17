
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
import { User, Mail, Phone, Car, CreditCard, Save, FileText, Image as ImageIcon } from "lucide-react";
import type { Profile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Label } from "@/components/ui/label";

const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional(), // Email might not be editable
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  vehicleDetails: z.string().min(5, { message: "Vehicle details are required." }),
  bankAccountNumber: z.string().min(8, {message: "Bank account number is required."}), // Should be handled securely
  // profilePicture: z.instanceof(File).optional(),
});

interface ProfileFormProps {
  profile: Profile; // Initial profile data
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { toast } = useToast();
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(profile.profilePictureUrl || null);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      vehicleDetails: profile.vehicleDetails,
      bankAccountNumber: profile.bankAccountNumber, // This is for display, actual update needs security
    },
  });

  function onSubmit(values: z.infer<typeof profileFormSchema>) {
    // Mock profile update logic
    console.log("Updated profile values:", values);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully saved.",
      className: "bg-green-500 text-white",
    });
  }

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Here you would typically upload the file
      // For now, just set a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
       toast({ title: "Profile Picture Selected", description: "Click 'Save Changes' to update."});
    }
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarImage src={profilePicturePreview || "https://placehold.co/150x150.png"} alt={profile.fullName} data-ai-hint="person face" />
                <AvatarFallback>{profile.fullName.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-2xl font-bold text-primary">{profile.fullName}</CardTitle>
                <CardDescription>Manage your personal information and settings.</CardDescription>
                 <Label htmlFor="profile-picture-upload" className="mt-2 inline-flex items-center text-sm text-primary hover:underline cursor-pointer">
                    <ImageIcon className="mr-1 h-4 w-4" /> Change Profile Picture
                </Label>
                <Input id="profile-picture-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
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
                    <Input {...field} />
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
                    <Input type="tel" {...field} />
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
                    <Input placeholder="e.g., Honda Activa - MH01AB1234" {...field} />
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
                    {/* In a real app, this would be handled much more securely, possibly by redirecting to a secure portal or using masked inputs */}
                    <Input placeholder="Enter your bank account number" {...field} />
                  </FormControl>
                  <FormDescription>Ensure this is accurate for receiving payouts.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-5 w-5"/> Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

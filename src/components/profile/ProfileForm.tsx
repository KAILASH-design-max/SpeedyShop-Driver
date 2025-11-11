

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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { User, Phone, Car, Save, Loader2, Banknote, Bike, Edit, MapPin } from "lucide-react";
import type { Profile } from "@/types";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  
  preferredZone: z.string().optional(),

  vehicleType: z.enum(["bike", "scooter", "car"]),
  vehicleRegistrationNumber: z.string().min(2, { message: "Vehicle registration number is required." }),
  drivingLicenseNumber: z.string().optional(),
  'documents.driverLicense.expiryDate': z.string().optional(),
});

interface ProfileFormProps {
  profile: Profile;
  onUpdate: (data: Partial<Profile> | Record<string,any>) => Promise<void>;
  children: React.ReactNode;
}

export function ProfileForm({ profile, onUpdate, children }: ProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {},
  });

  useEffect(() => {
    form.reset({
      name: profile.name || "",
      phoneNumber: profile.phoneNumber || "",
      preferredZone: profile.preferredZone || "",
      vehicleType: profile.vehicleType || "bike",
      vehicleRegistrationNumber: profile.vehicleRegistrationNumber || "",
      drivingLicenseNumber: profile.drivingLicenseNumber || "",
      'documents.driverLicense.expiryDate': profile.documents?.driverLicense?.expiryDate || "",
    });
  }, [profile, form, open]);


  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsSaving(true);
    // The form gives us a flat structure for the expiry date, so we need to nest it correctly for Firestore.
    const { 'documents.driverLicense.expiryDate': expiryDate, ...restValues } = values;
    const updateData = {
        ...restValues,
        documents: {
            ...profile.documents,
            driverLicense: {
                ...profile.documents?.driverLicense,
                expiryDate: expiryDate,
            },
        },
    };

    await onUpdate(updateData);
    setIsSaving(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
         <DialogHeader>
           <DialogTitle className="text-xl">Edit Profile</DialogTitle>
         </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
            <h3 className="text-lg font-semibold text-primary border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name" 
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
                name="phoneNumber" 
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
                name="preferredZone" 
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground"/>Preferred Delivery Zone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Koramangala, Indiranagar" {...field} disabled={isSaving}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator className="my-6"/>

            <h3 className="text-lg font-semibold text-primary border-b pb-2">Vehicle & License Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Bike className="mr-2 h-4 w-4 text-muted-foreground"/>Vehicle Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
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
                      <Input placeholder="e.g., MH01AB1234" {...field} disabled={isSaving}/>
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
                      <Input placeholder="Enter your driving license number" {...field} disabled={isSaving}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documents.driverLicense.expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-muted-foreground"/>License Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isSaving}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

             <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="w-full mt-2 sm:mt-0 sm:w-auto" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5"/>}
                    Save Changes
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

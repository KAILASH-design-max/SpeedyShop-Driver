
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, Car, FileText, Bike } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Profile } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  vehicleType: z.enum(["bike", "scooter", "car"], { required_error: "Please select a vehicle type." }),
  vehicleRegistrationNumber: z.string().min(2, { message: "Vehicle registration number is required." }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions to continue." }),
  }),
});

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      vehicleRegistrationNumber: "",
      termsAccepted: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const initialProfileData: Profile = {
        uid: user.uid,
        email: values.email,
        name: values.name,
        vehicleDetails: `${values.vehicleType} - ${values.vehicleRegistrationNumber}`, // for legacy
        vehicleType: values.vehicleType,
        vehicleRegistrationNumber: values.vehicleRegistrationNumber,
        phoneNumber: "", // To be filled in profile page
        profilePictureUrl: "",
        role: "deliveryPartner", // Default role
        verificationStatus: 'pending',
        documents: {
            driverLicense: undefined,
            vehicleRegistration: undefined,
            proofOfInsurance: undefined,
            pan: undefined,
        },
        bankDetails: {
          accountHolderName: "",
          accountNumber: "",
          ifscCode: ""
        },
        termsAccepted: values.termsAccepted,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        availabilityStatus: 'offline', // Default availability status
      };
      await setDoc(doc(db, "users", user.uid), initialProfileData);

      toast({
        title: "Account Created!",
        description: "Your account has been successfully created. Please complete your profile.",
        className: "bg-green-500 text-white",
      });
      router.push("/profile");
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Failed to create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use. Please try a different email or log in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
      }
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="text-center">
         <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full inline-block">
          <UserPlus className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold text-primary">Join Velocity Driver</CardTitle>
        <CardDescription>Sign up to start delivering and earning.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><UserPlus className="mr-2 h-4 w-4 text-muted-foreground"/>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isLoading} />
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
                  <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground"/>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Bike className="mr-2 h-4 w-4 text-muted-foreground"/>Vehicle Type</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your vehicle type" />
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
                    <Input placeholder="e.g., MH01AB1234" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Upload Documents</FormLabel>
              <FormDescription>
                Document uploads will be handled on your profile page after signup.
              </FormDescription>
            </FormItem>
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                       <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
             {isLoading ? "Signing up..." : <><UserPlus className="mr-2 h-5 w-5" /> Sign Up</>}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

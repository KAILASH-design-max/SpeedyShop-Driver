
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, KeyRound, Car, Bike, User } from "lucide-react";
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

const ScooterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 9.5H15.5C16.8807 9.5 18 10.6193 18 12V14.5H21.5L20 17.5H4.5L3 14.5H6.5V12C6.5 10.6193 7.61929 9.5 9 9.5H10.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 14.5H17.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.5 9.5V7.5C10.5 6.17588 9.32412 5.5 8 5.5C6.67588 5.5 5.5 6.17588 5.5 7.5V9.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6.5" cy="17.5" r="2" stroke="#4A4A4A" strokeWidth="1.5"/>
        <circle cx="17.5" cy="17.5" r="2" stroke="#4A4A4A" strokeWidth="1.5"/>
        <path d="M15 9.5L13.5 7.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

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
    <div className="w-full max-w-sm z-10">
       <div className="flex flex-col items-center text-center mb-8">
        <ScooterIcon className="h-20 w-20 mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">Deliverzler</h1>
      </div>
      
      <div className="text-left mb-6">
        <h2 className="text-3xl font-bold text-primary">Create Account</h2>
        <p className="text-muted-foreground">Sign up to start your journey</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input placeholder="Full Name" {...field} disabled={isLoading} className="pl-10 h-12 rounded-lg bg-white"/>
                  </div>
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
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input placeholder="Email" {...field} disabled={isLoading} className="pl-10 h-12 rounded-lg bg-white"/>
                  </div>
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
                <FormControl>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input type="password" placeholder="Password" {...field} disabled={isLoading} className="pl-10 h-12 rounded-lg bg-white" />
                  </div>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger className="pl-10 h-12 rounded-lg bg-white">
                      <Bike className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                <FormControl>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input placeholder="Vehicle Registration No." {...field} disabled={isLoading} className="pl-10 h-12 rounded-lg bg-white"/>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md pt-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal text-muted-foreground">
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">
                      Terms & Conditions
                    </Link>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full h-12 rounded-lg text-lg font-bold mt-4" disabled={isLoading}>
           {isLoading ? "Creating Account..." : "SIGN UP"}
          </Button>
        </form>
      </Form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

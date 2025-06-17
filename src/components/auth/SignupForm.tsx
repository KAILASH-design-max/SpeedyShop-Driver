
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, Car, FileText } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  vehicleInfo: z.string().min(2, { message: "Vehicle information is required." }),
  // For file upload, actual handling would be more complex
  // For this prototype, we'll just use a text input or a basic file input
  // documents: z.instanceof(File).optional(), // This is tricky with SSR and RHF.
});

export function SignupForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      vehicleInfo: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Mock signup logic
    console.log("Signup values:", values);
    // In a real app, you would create the user and handle document uploads
    router.push("/dashboard"); 
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
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><UserPlus className="mr-2 h-4 w-4 text-muted-foreground"/>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                    <Input placeholder="you@example.com" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicleInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-muted-foreground"/>Vehicle Information</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Honda Activa, Blue Bike" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Upload Documents</FormLabel>
              <FormControl>
                <Input type="file" multiple className="cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 file:hover:bg-primary/20 file:border-none file:rounded-md file:px-3 file:py-1.5" />
              </FormControl>
              <FormDescription>
                Upload driver&apos;s license, vehicle registration, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
             <UserPlus className="mr-2 h-5 w-5" /> Sign Up
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

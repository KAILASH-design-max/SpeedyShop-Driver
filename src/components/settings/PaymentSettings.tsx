
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
import { User, Save, Loader2, Banknote } from "lucide-react";
import type { Profile } from "@/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "../ui/switch";

const paymentSettingsSchema = z.object({
  bankDetails: z.object({
    accountHolderName: z.string().min(2, "Account holder name is required"),
    accountNumber: z.string().min(5, "A valid account number is required"),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
    upiId: z.string().optional(),
  }),
  autoWithdrawalEnabled: z.boolean().optional(),
});

interface PaymentSettingsProps {
  profile: Profile;
  onUpdate: (data: Partial<Profile> | Record<string, any>) => Promise<void>;
}

export function PaymentSettings({ profile, onUpdate }: PaymentSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof paymentSettingsSchema>>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
        bankDetails: {
            accountHolderName: profile.bankDetails?.accountHolderName || "",
            accountNumber: profile.bankDetails?.accountNumber || "",
            ifscCode: profile.bankDetails?.ifscCode || "",
            upiId: profile.bankDetails?.upiId || "",
        },
        autoWithdrawalEnabled: profile.autoWithdrawalEnabled || false,
    },
  });

  useEffect(() => {
    form.reset({
        bankDetails: {
            accountHolderName: profile.bankDetails?.accountHolderName || "",
            accountNumber: profile.bankDetails?.accountNumber || "",
            ifscCode: profile.bankDetails?.ifscCode || "",
            upiId: profile.bankDetails?.upiId || "",
        },
        autoWithdrawalEnabled: profile.autoWithdrawalEnabled || false,
    });
  }, [profile, form]);


  async function onSubmit(values: z.infer<typeof paymentSettingsSchema>) {
    setIsSaving(true);
    await onUpdate(values);
    setIsSaving(false);
  }

  return (
    <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-primary">
                <Banknote className="mr-3 h-6 w-6"/>
                Payment Settings
            </CardTitle>
            <CardDescription>
                Manage your bank account details for payouts. Changes may require re-verification.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
                <FormField
                    control={form.control}
                    name="bankDetails.accountHolderName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/>Account Holder Name</FormLabel>
                        <FormControl>
                        <Input placeholder="Name as per bank records" {...field} disabled={isSaving}/>
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
                        <Input placeholder="Enter account number" {...field} disabled={isSaving}/>
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
                        <Input placeholder="Enter IFSC code" {...field} disabled={isSaving}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bankDetails.upiId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><Banknote className="mr-2 h-4 w-4 text-muted-foreground"/>UPI ID (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="yourname@upi" {...field} disabled={isSaving}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="autoWithdrawalEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Auto-Withdrawal</FormLabel>
                                <FormDescription>
                                Automatically transfer your earnings to your bank account weekly.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isSaving}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />


                <Button type="submit" className="w-full mt-4" size="lg" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5"/>}
                    Save Payment Settings
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}

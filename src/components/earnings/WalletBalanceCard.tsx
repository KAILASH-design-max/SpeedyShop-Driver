"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, IndianRupee, Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const payoutSchema = z.object({
    amount: z.coerce.number().positive("Amount must be greater than 0."),
    payoutMethod: z.enum(["upi", "bank"], {
        required_error: "You need to select a payout method.",
    }),
    upiId: z.string().optional(),
}).refine(data => {
    if (data.payoutMethod === 'upi') {
        return !!data.upiId && data.upiId.includes('@');
    }
    return true;
}, {
    message: "A valid UPI ID is required for UPI transfers.",
    path: ["upiId"],
});


export function WalletBalanceCard() {
    const walletBalance = 11868.00; // Static value for now
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof payoutSchema>>({
        resolver: zodResolver(payoutSchema),
        defaultValues: {
            amount: 100,
            payoutMethod: 'upi',
            upiId: "yourname@bank"
        }
    });
    
    const payoutMethod = form.watch("payoutMethod");

    const onSubmit = (values: z.infer<typeof payoutSchema>) => {
        console.log("Payout Request:", values);
        toast({
            title: "Payout Requested",
            description: `A payout of ₹${values.amount} has been requested via ${values.payoutMethod.toUpperCase()}.`,
            className: "bg-green-500 text-white",
        });
        setOpen(false);
        form.reset();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-bold">
                        <Wallet className="mr-3 h-6 w-6 text-primary" />
                        Wallet Balance
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center bg-muted/50 p-6 rounded-lg">
                        <p className="text-4xl font-bold text-primary flex items-center justify-center">
                            <IndianRupee size={30} className="mr-1" />
                            {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-muted-foreground mt-1">Next payout: Tuesday</p>
                    </div>
                     <DialogTrigger asChild>
                        <Button className="w-full" size="lg">
                            <Download className="mr-2 h-5 w-5" />
                            Withdraw Funds
                        </Button>
                    </DialogTrigger>
                </CardContent>
            </Card>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                    <DialogDescription>
                        Withdraw funds from your wallet. Payouts are processed within 24 hours.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="payoutMethod"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Payout Method</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                    >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="upi" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            UPI
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="bank" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Bank Transfer
                                        </FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        {payoutMethod === 'upi' && (
                             <FormField
                                control={form.control}
                                name="upiId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>UPI ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="yourname@bank" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <DialogFooter>
                             <DialogClose asChild>
                                <Button type="button" variant="outline">
                                Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit">
                                Request Payout
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
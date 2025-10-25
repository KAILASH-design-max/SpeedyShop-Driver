
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-primary">
            <FileText className="mr-3 h-6 w-6" />
            Terms and Conditions
          </CardTitle>
          <CardDescription>
            Last Updated: {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Introduction</h2>
            <p>
              Welcome to SpeedyDelivery! These terms and conditions outline the rules and regulations for the use of our application and services. By accessing this app, we assume you accept these terms and conditions. Do not continue to use SpeedyDelivery if you do not agree to all of the terms and conditions stated on this page.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. User Accounts</h2>
            <p>
              You must be at least 18 years of age to create an account. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your device. You agree to accept responsibility for all activities that occur under your account or password.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Deliveries</h2>
            <p>
              As a delivery partner, you agree to complete deliveries in a safe, timely, and professional manner. You are responsible for maintaining your vehicle in good working condition and complying with all local traffic laws. SpeedyDelivery is a platform that connects you with delivery opportunities and is not responsible for your actions while performing deliveries.
            </p>
          </section>
           <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Payments</h2>
            <p>
              You will be paid for completed deliveries according to the payment structure detailed in the Earnings section of the app. Payments are processed on a weekly cycle. We reserve the right to adjust or withhold payments for any fraudulent activity or violation of these terms.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
            <p>
              In no event shall SpeedyDelivery, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

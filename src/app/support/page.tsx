import { Faq } from "@/components/support/Faq";
import { EmergencySupport } from "@/components/support/EmergencySupport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Siren, Info, BookOpen } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="container mx-auto px-6 py-4 md:px-8 md:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Faq />
        </div>
        <div className="space-y-8">
          <EmergencySupport />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5" /> Resources</CardTitle>
              <CardDescription>
                Access training materials and legal information.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <Link href="/training" passHref>
                    <Button variant="outline" className="w-full justify-start"><Info className="mr-2 h-4 w-4" />Training & Tutorials</Button>
                </Link>
                <Button variant="outline" className="w-full justify-start"><Siren className="mr-2 h-4 w-4"/>Terms of Service</Button>
                <Button variant="outline" className="w-full justify-start"><ShieldCheck className="mr-2 h-4 w-4" />Privacy Policy</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


"use client";

import { TrainingModule } from "@/components/training/TrainingModule";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";


export default function TrainingPage() {
    const router = useRouter();

  return (
    <div className="container mx-auto p-6 space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <TrainingModule />
    </div>
  );
}

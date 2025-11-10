
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";

export function ChatHeader() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between p-4 md:p-0 md:pb-4 border-b md:border-b-0">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center">
            Support Chat
          </h1>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";

export function ChatHeader() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between p-4 md:hidden border-b">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
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

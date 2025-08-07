
"use client";

import { ChatInterface } from "@/components/communication/ChatInterface";
import { useSearchParams } from "next/navigation";

export function ChatPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
      <ChatInterface preselectedThreadId={orderId} />
  );
}

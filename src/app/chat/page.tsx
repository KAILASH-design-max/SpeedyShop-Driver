
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatPageContent } from './ChatPageContent';
import { ChatHeader } from '@/components/chat/ChatHeader';

export default function ChatPage() {
  return (
    <div className="h-screen md:h-[calc(100vh-5rem)] flex flex-col">
      <ChatHeader />
      <div className="flex-grow min-h-0">
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          <ChatPageContent />
        </Suspense>
      </div>
    </div>
  );
}

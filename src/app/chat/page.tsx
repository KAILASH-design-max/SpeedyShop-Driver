
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatPageContent } from './ChatPageContent';

export default function ChatPage() {
  return (
    <div className="container mx-auto h-[calc(100vh-6.5rem)] flex flex-col p-0 md:px-6 md:pb-6">
      <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <ChatPageContent />
      </Suspense>
    </div>
  );
}

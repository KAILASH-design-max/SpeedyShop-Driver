
import { Suspense } from 'react';
import { CommunicationPageContent } from './CommunicationPageContent';
import { Loader2 } from 'lucide-react';

export default function CommunicationPage() {
  return (
    <div className="container mx-auto h-[calc(100vh-10rem)] flex flex-col p-0 md:p-6">
      <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <CommunicationPageContent />
      </Suspense>
    </div>
  );
}

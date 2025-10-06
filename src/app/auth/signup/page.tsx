
export const dynamic = 'force-dynamic';

import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
     <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-100/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-purple-100/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-48 right-20 w-72 h-72 bg-pink-100/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <SignupForm />
    </main>
  );
}


export const dynamic = 'force-dynamic';

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="absolute top-8 right-8 text-2xl font-bold text-primary">
        Velocity Driver
      </div>
      <LoginForm />
    </main>
  );
}

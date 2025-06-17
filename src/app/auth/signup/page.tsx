
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-primary/10">
       <div className="absolute top-8 right-8 text-2xl font-bold text-primary">
        Velocity Driver
      </div>
      <SignupForm />
    </main>
  );
}

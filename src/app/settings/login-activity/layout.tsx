
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function LoginActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

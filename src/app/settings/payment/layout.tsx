
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function PaymentSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

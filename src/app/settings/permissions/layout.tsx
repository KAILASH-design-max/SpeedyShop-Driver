
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function PermissionsSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

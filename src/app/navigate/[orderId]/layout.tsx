
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function NavigateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

    
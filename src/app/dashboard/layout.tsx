
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { Suspense } from 'react';

export default function DashboardFeatureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedLayout>
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </AuthenticatedLayout>
  );
}

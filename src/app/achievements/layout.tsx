
"use client";
import React from 'react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { usePathname } from 'next/navigation';

export default function AchievementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAchievementsPage = pathname === '/achievements';

  // Find the child page component to get its props
  const page = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type.name === 'AchievementsPage'
  ) as React.ReactElement | undefined;

  const onRefresh = page?.props.onRefresh;
  const isRefreshing = page?.props.isRefreshing;

  return (
    <AuthenticatedLayout
      onRefresh={isAchievementsPage ? onRefresh : undefined}
      isRefreshing={isAchievementsPage ? isRefreshing : undefined}
    >
      {children}
    </AuthenticatedLayout>
  );
}

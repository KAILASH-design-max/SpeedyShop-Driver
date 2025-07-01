
"use client";

import { ActiveTimeTracker } from './ActiveTimeTracker';

interface DashboardHeaderProps {
  userId: string | undefined;
}

export function DashboardHeader({ userId }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <h1 className="text-3xl font-bold text-primary">Driver Dashboard</h1>
      {userId && <ActiveTimeTracker userId={userId} />}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/sidebar";
import { useToast } from "@/components/ui/toast";
import { apiRequest, onTokenExpired, clearTokenExpiredCallback, getAccessTokenExpiry, scheduleTokenWarning } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    function handleExpired() {
      toast.error("Session expired", "Please log in again.");
      clearTokenExpiredCallback();
      router.push("/login");
    }

    onTokenExpired(handleExpired);
    scheduleTokenWarning();

    return () => {
      clearTokenExpiredCallback();
    };
  }, [router, toast]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_30%),hsl(var(--background))]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

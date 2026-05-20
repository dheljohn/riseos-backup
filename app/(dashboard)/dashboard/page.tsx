"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const SleepChart = dynamic(() => import("@/components/charts/SleepChart"), {
  ssr: false,
});
const FocusChart = dynamic(() => import("@/components/charts/FocusChart"), {
  ssr: false,
});

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, clearAuth } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["summary"],
    queryFn: async () => {
      const res = await api.get("/summary");
      return res.data;
    },
    enabled: isAuthenticated,
  });

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    clearAuth();
    toast.success("Logged out");
    router.push("/login");
  }

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">RiseOS</h1>
            <p className="text-muted-foreground text-sm">
              Hey {user?.name} — here's your week
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">
            Loading your week...
          </div>
        ) : (
          <>
            {/* Patterns */}
            {summary?.patterns?.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    This Week's Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summary.patterns.map((pattern: string, i: number) => (
                    <p
                      key={i}
                      className="text-sm text-muted-foreground flex gap-2"
                    >
                      <span>•</span>
                      <span>{pattern}</span>
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Avg Bedtime Gap"
                value={`${summary?.sleep?.avgBedGapMins ?? 0} min`}
                sub={summary?.sleep?.avgBedGapMins > 0 ? "late" : "early"}
              />
              <StatCard
                label="Avg Sleep"
                value={`${((summary?.sleep?.avgActualDurationMins ?? 0) / 60).toFixed(1)}h`}
                sub="per night"
              />
              <StatCard
                label="Focus Sessions"
                value={`${summary?.focus?.completedSessions ?? 0}/${summary?.focus?.totalSessions ?? 0}`}
                sub="completed"
              />
              <StatCard
                label="Total Focus"
                value={`${((summary?.focus?.totalFocusMinutes ?? 0) / 60).toFixed(1)}h`}
                sub="this week"
              />
            </div>

            {/* Charts */}
            {summary?.sleep?.logs?.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Sleep Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <SleepChart logs={summary.sleep.logs} />
                </CardContent>
              </Card>
            )}

            {summary?.focus?.sessions?.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Focus Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <FocusChart sessions={summary.focus.sessions} />
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-1"
                onClick={() => router.push("/sleep")}
              >
                <span className="text-xl">😴</span>
                <span className="text-xs">Log Sleep</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-1"
                onClick={() => router.push("/meals")}
              >
                <span className="text-xl">🍽️</span>
                <span className="text-xs">Log Meal</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-1"
                onClick={() => router.push("/focus")}
              >
                <span className="text-xl">🎯</span>
                <span className="text-xs">Log Focus</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

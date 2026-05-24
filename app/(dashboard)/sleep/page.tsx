"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { format } from "date-fns";

const ENERGY_OPTIONS = [
  { value: 1, emoji: "😴", label: "Exhausted" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🔥", label: "Energized" },
];

export default function SleepPage() {
  const router = useRouter();

  // const today = new Date().toISOString().split("T")[0];

  const { isAuthenticated } = useAuthStore();

  const queryClient = useQueryClient();

  const [durationHrs, setDurationHrs] = useState(8);

  const [energyLevel, setEnergyLevel] = useState(3);

  // const [logDay, setLogDay] = useState(new Date().toISOString().split("T")[0]);
  const [logDay, setLogDay] = useState(format(new Date(), "yyyy-MM-dd"));

  // =========================
  // Fetch Logs
  // =========================

  const { data: logs, isLoading } = useQuery({
    queryKey: ["sleep"],

    queryFn: async () => {
      const res = await api.get("/sleep");
      return res.data;
    },

    enabled: isAuthenticated,
  });

  // =========================
  // Save Sleep Log
  // =========================

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/sleep", {
        durationHrs,
        energyLevel,
        logDay,
      });
      console.log("logDay:", logDay);
      return res.data;
    },

    onSuccess: () => {
      toast.success("Sleep log saved!");

      queryClient.invalidateQueries({
        queryKey: ["sleep"],
      });

      queryClient.invalidateQueries({
        queryKey: ["summary"],
      });

      setDurationHrs(8);
      setEnergyLevel(3);
      setLogDay(format(new Date(), "yyyy-MM-dd"));
    },

    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? "Failed to save sleep log");
    },
  });

  // =========================
  // Delete Log
  // =========================

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sleep/${id}`);
    },

    onSuccess: () => {
      toast.success("Sleep log deleted");

      queryClient.invalidateQueries({
        queryKey: ["sleep"],
      });

      queryClient.invalidateQueries({
        queryKey: ["summary"],
      });
    },

    onError: () => {
      toast.error("Failed to delete log");
    },
  });

  // =========================
  // Helpers
  // =========================

  const selectedEnergy = ENERGY_OPTIONS.find((e) => e.value === energyLevel);

  // =========================
  // UI
  // =========================

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            ← Back
          </Button>

          <h1 className="text-xl font-bold">Sleep Tracker</h1>
        </div>

        {/* Sleep Logger */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How was your sleep?</CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="space-y-2">
              <span className="text-sm font-medium">Log Date</span>

              <DatePicker value={logDay} onChange={setLogDay} />

              <p className="text-xs text-muted-foreground">
                You can log sleep for past days
              </p>
            </div>
            {/* Sleep Duration */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Sleep Duration</span>

                <span className="text-2xl font-bold">{durationHrs}h</span>
              </div>

              <input
                title="Sleep Duration"
                type="range"
                min={1}
                max={12}
                step={0.5}
                value={durationHrs}
                onChange={(e) => setDurationHrs(Number(e.target.value))}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1h</span>
                <span>12h</span>
              </div>
            </div>

            {/* Energy Level */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Energy Level</span>

                <span className="text-sm text-muted-foreground">
                  {selectedEnergy?.label}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {ENERGY_OPTIONS.map((energy) => (
                  <Button
                    key={energy.value}
                    variant={
                      energyLevel === energy.value ? "default" : "outline"
                    }
                    className="h-16 text-2xl"
                    onClick={() => setEnergyLevel(energy.value)}
                  >
                    {energy.emoji}
                  </Button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              className="w-full h-12 text-base"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Sleep Log"}
            </Button>
          </CardContent>
        </Card>

        {/* Logs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Previous Logs</h2>

            {logs?.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {logs.length} logs
              </span>
            )}
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : logs?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sleep logs yet.</p>
          ) : (
            logs?.map((log: any) => {
              const energy = ENERGY_OPTIONS.find(
                (e) => e.value === log.energyLevel,
              );

              return (
                <Card key={log.id}>
                  <CardContent className="pt-5">
                    <div className="flex justify-between items-start">
                      {/* Left */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{energy?.emoji}</span>

                          <div>
                            <p className="font-semibold">
                              {log.durationHrs}h sleep
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {energy?.label}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {log.logDay} •{" "}
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-red-500"
                        onClick={() => deleteMutation.mutate(log.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

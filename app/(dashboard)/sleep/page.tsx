"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SleepPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    intendedBed: "",
    actualBed: "",
    intendedWake: "",
    actualWake: "",
    quality: "",
    notes: "",
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["sleep"],
    queryFn: async () => {
      const res = await api.get("/sleep");
      return res.data;
    },
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post("/sleep", {
        intendedBed: new Date(data.intendedBed).toISOString(),
        actualBed: new Date(data.actualBed).toISOString(),
        intendedWake: new Date(data.intendedWake).toISOString(),
        actualWake: new Date(data.actualWake).toISOString(),
        quality: data.quality ? parseInt(data.quality) : null,
        notes: data.notes || null,
      });
      return res.data;
    },

    onSuccess: () => {
      toast.success("Sleep log saved!");
      queryClient.invalidateQueries({ queryKey: ["sleep"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      setForm({
        intendedBed: "",
        actualBed: "",
        intendedWake: "",
        actualWake: "",
        quality: "",
        notes: "",
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? "Failed to save");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sleep/${id}`);
    },
    onSuccess: () => {
      toast.success("Log deleted");
      queryClient.invalidateQueries({ queryKey: ["sleep"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to delete");
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit() {
    if (
      !form.intendedBed ||
      !form.actualBed ||
      !form.intendedWake ||
      !form.actualWake
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    mutation.mutate(form);
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold">Sleep Log</h1>
        </div>

        {/* Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Log a Sleep Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Intended Bedtime</Label>
                <Input
                  type="datetime-local"
                  name="intendedBed"
                  value={form.intendedBed}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Actual Bedtime</Label>
                <Input
                  type="datetime-local"
                  name="actualBed"
                  value={form.actualBed}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Intended Wake</Label>
                <Input
                  type="datetime-local"
                  name="intendedWake"
                  value={form.intendedWake}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Actual Wake</Label>
                <Input
                  type="datetime-local"
                  name="actualWake"
                  value={form.actualWake}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sleep Quality (1-5)</Label>
              <Input
                type="number"
                name="quality"
                min={1}
                max={5}
                placeholder="Optional"
                value={form.quality}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                name="notes"
                placeholder="Optional"
                value={form.notes}
                onChange={handleChange}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Sleep Log"}
            </Button>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-4">
          <h2 className="font-semibold">Previous Logs</h2>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : logs?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sleep logs yet.</p>
          ) : (
            logs?.map((log: any) => (
              <Card key={log.id}>
                <CardContent className="pt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bedtime gap</span>
                    <span
                      className={
                        log.gaps.bedGap.diffMinutes > 0
                          ? "text-red-500"
                          : "text-green-500"
                      }
                    >
                      {log.gaps.bedGap.diffLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Wake gap</span>
                    <span
                      className={
                        log.gaps.wakeGap.diffMinutes > 0
                          ? "text-red-500"
                          : "text-green-500"
                      }
                    >
                      {log.gaps.wakeGap.diffLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>
                      {(log.gaps.actualDurationMins / 60).toFixed(1)}h
                    </span>
                  </div>
                  {log.quality && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quality</span>
                      <span>{"⭐".repeat(log.quality)}</span>
                    </div>
                  )}
                  {log.notes && (
                    <p className="text-xs text-muted-foreground pt-1">
                      {log.notes}
                    </p>
                  )}
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-red-500"
                      onClick={() => deleteMutation.mutate(log.id)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

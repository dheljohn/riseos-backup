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

export default function FocusPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    intendedStart: "",
    actualStart: "",
    intendedEnd: "",
    actualEnd: "",
    completed: true,
    notes: "",
  });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["focus"],
    queryFn: async () => {
      const res = await api.get("/focus");
      return res.data;
    },
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post("/focus", {
        title: data.title,
        intendedStart: new Date(data.intendedStart).toISOString(),
        actualStart: new Date(data.actualStart).toISOString(),
        intendedEnd: new Date(data.intendedEnd).toISOString(),
        actualEnd: new Date(data.actualEnd).toISOString(),
        completed: data.completed,
        notes: data.notes || null,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Focus session saved!");
      queryClient.invalidateQueries({ queryKey: ["focus"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      setForm({
        title: "",
        intendedStart: "",
        actualStart: "",
        intendedEnd: "",
        actualEnd: "",
        completed: true,
        notes: "",
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? "Failed to save");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/focus/${id}`);
    },
    onSuccess: () => {
      toast.success("Session deleted");
      queryClient.invalidateQueries({ queryKey: ["focus"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to delete");
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  }

  function handleSubmit() {
    if (
      !form.title ||
      !form.intendedStart ||
      !form.actualStart ||
      !form.intendedEnd ||
      !form.actualEnd
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
          <h1 className="text-xl font-bold">Focus Log</h1>
        </div>

        {/* Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Log a Focus Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Session Title</Label>
              <Input
                name="title"
                placeholder="e.g. Deep work on RiseOS"
                value={form.title}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Intended Start</Label>
                <Input
                  type="datetime-local"
                  name="intendedStart"
                  value={form.intendedStart}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Actual Start</Label>
                <Input
                  type="datetime-local"
                  name="actualStart"
                  value={form.actualStart}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Intended End</Label>
                <Input
                  type="datetime-local"
                  name="intendedEnd"
                  value={form.intendedEnd}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Actual End</Label>
                <Input
                  type="datetime-local"
                  name="actualEnd"
                  value={form.actualEnd}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                title="Focus"
                type="checkbox"
                id="completed"
                name="completed"
                checked={form.completed}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <Label htmlFor="completed">Session completed</Label>
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
              {mutation.isPending ? "Saving..." : "Save Focus Session"}
            </Button>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div className="space-y-4">
          <h2 className="font-semibold">Previous Sessions</h2>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : sessions?.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No focus sessions yet.
            </p>
          ) : (
            sessions?.map((session: any) => (
              <Card key={session.id}>
                <CardContent className="pt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{session.title}</span>
                    <span>{session.completed ? "✅" : "❌"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Start gap</span>
                    <span
                      className={
                        session.gaps.startGap.diffMinutes > 0
                          ? "text-red-500"
                          : "text-green-500"
                      }
                    >
                      {session.gaps.startGap.diffLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>
                      {(session.gaps.actualDurationMins / 60).toFixed(1)}h
                      {session.gaps.actualDurationMins >
                      session.gaps.intendedDurationMins
                        ? ` (${session.gaps.actualDurationMins - session.gaps.intendedDurationMins} min over)`
                        : ""}
                    </span>
                  </div>
                  {session.notes && (
                    <p className="text-xs text-muted-foreground pt-1">
                      {session.notes}
                    </p>
                  )}
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-red-500"
                      onClick={() => deleteMutation.mutate(session.id)}
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

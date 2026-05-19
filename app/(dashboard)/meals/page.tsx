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

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function MealsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    mealType: "breakfast",
    intendedTime: "",
    actualTime: "",
    description: "",
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["meals"],
    queryFn: async () => {
      const res = await api.get("/meals");
      return res.data;
    },
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post("/meals", {
        mealType: data.mealType,
        intendedTime: new Date(data.intendedTime).toISOString(),
        actualTime: new Date(data.actualTime).toISOString(),
        description: data.description || null,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Meal log saved!");
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      setForm({
        mealType: "breakfast",
        intendedTime: "",
        actualTime: "",
        description: "",
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? "Failed to save");
    },
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit() {
    if (!form.intendedTime || !form.actualTime) {
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
          <h1 className="text-xl font-bold">Meal Log</h1>
        </div>

        {/* Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Log a Meal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Meal Type</Label>
              <select
                title="Meal Type"
                name="mealType"
                value={form.mealType}
                onChange={handleChange}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm"
              >
                {MEAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Intended Time</Label>
                <Input
                  type="datetime-local"
                  name="intendedTime"
                  value={form.intendedTime}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Actual Time</Label>
                <Input
                  type="datetime-local"
                  name="actualTime"
                  value={form.actualTime}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                name="description"
                placeholder="Optional"
                value={form.description}
                onChange={handleChange}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Meal Log"}
            </Button>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-4">
          <h2 className="font-semibold">Previous Logs</h2>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : logs?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No meal logs yet.</p>
          ) : (
            logs?.map((log: any) => (
              <Card key={log.id}>
                <CardContent className="pt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium capitalize">
                      {log.mealType}
                    </span>
                    <span
                      className={
                        log.gaps.timeGap.diffMinutes > 0
                          ? "text-red-500"
                          : "text-green-500"
                      }
                    >
                      {log.gaps.timeGap.diffLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Intended</span>
                    <span>
                      {new Date(log.intendedTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Actual</span>
                    <span>
                      {new Date(log.actualTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-xs text-muted-foreground pt-1">
                      {log.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

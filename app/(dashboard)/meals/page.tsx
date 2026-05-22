"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function MealsPage() {
  const router = useRouter();

  const { isAuthenticated } = useAuthStore();

  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    mealType: "breakfast",

    name: "",

    calories: "",
  });

  // =========================
  // GET Meals
  // =========================

  const { data: logs, isLoading } = useQuery({
    queryKey: ["meals"],

    queryFn: async () => {
      const res = await api.get("/meals");

      return res.data;
    },

    enabled: isAuthenticated,
  });

  // =========================
  // CREATE Meal
  // =========================

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post("/meals", {
        mealType: data.mealType,

        name: data.name,

        calories: data.calories ? Number(data.calories) : null,
      });

      return res.data;
    },

    onSuccess: () => {
      toast.success("Meal added!");

      queryClient.invalidateQueries({
        queryKey: ["meals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["summary"],
      });

      setForm({
        mealType: "breakfast",

        name: "",

        calories: "",
      });
    },

    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? "Failed to save meal");
    },
  });

  // =========================
  // DELETE Meal
  // =========================

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/meals/${id}`);
    },

    onSuccess: () => {
      toast.success("Meal deleted");

      queryClient.invalidateQueries({
        queryKey: ["meals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["summary"],
      });
    },

    onError: () => {
      toast.error("Failed to delete");
    },
  });

  // =========================
  // Helpers
  // =========================

  const totalCalories =
    logs?.reduce((sum: number, meal: any) => sum + (meal.calories ?? 0), 0) ??
    0;

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("What meal did you eat?");

      return;
    }

    mutation.mutate(form);
  }

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

          <h1 className="text-xl font-bold">Meals</h1>
        </div>

        {/* Add Meal */}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Log a Meal</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Meal Type */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {MEAL_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={form.mealType === type ? "default" : "outline"}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,

                      mealType: type,
                    }))
                  }
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>

            {/* Meal Name */}

            <Input
              placeholder="What did you eat?"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,

                  name: e.target.value,
                }))
              }
            />

            {/* Calories */}

            <Input
              type="number"
              placeholder="Calories (optional)"
              value={form.calories}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,

                  calories: e.target.value,
                }))
              }
            />

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Adding..." : "Add Meal"}
            </Button>
          </CardContent>
        </Card>

        {/* Logs */}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Today's Meals</h2>

            <span className="text-sm text-muted-foreground">
              {totalCalories} kcal
            </span>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : logs?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No meals logged today.
            </p>
          ) : (
            logs?.map((log: any) => (
              <Card key={log.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    {/* Left */}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {log.mealType}
                        </span>

                        <span className="text-sm text-muted-foreground">•</span>

                        <span className="text-sm">{log.name}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {log.calories && <span>{log.calories} kcal</span>}

                        <span>
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",

                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Right */}

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
            ))
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const PRESETS = [25, 60, 90];
type TimerState = "idle" | "running" | "paused";

export default function FocusPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const savedRef = useRef(false);

  const [focusLabel, setFocusLabel] = useState("");
  const [selectedMins, setSelectedMins] = useState(25);
  const [customInput, setCustomInput] = useState("25");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startMinsRef = useRef(25);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["focus"],
    queryFn: async () => {
      const res = await api.get("/focus");
      return res.data;
    },
    enabled: isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: {
      label: string;
      durationMins: number;
      completed: boolean;
    }) => {
      const res = await api.post("/focus", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Focus session saved!");
      queryClient.invalidateQueries({ queryKey: ["focus"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
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
    onError: () => toast.error("Failed to delete"),
  });

  // Countdown tick
  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setTimerState("idle");
            if (!savedRef.current) {
              // ← only save once
              savedRef.current = true;
              saveMutation.mutate({
                label: focusLabel.trim() || "Focus Session",
                durationMins: startMinsRef.current,
                completed: true,
              });
              toast.success("Focus session complete! 🎉");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  function applyMins(mins: number) {
    if (timerState !== "idle") return;
    setSelectedMins(mins);
    setCustomInput(String(mins));
    setSecondsLeft(mins * 60);
    startMinsRef.current = mins;
  }

  function handleCustomInput(val: string) {
    setCustomInput(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed > 0 && timerState === "idle") {
      setSelectedMins(parsed);
      setSecondsLeft(parsed * 60);
      startMinsRef.current = parsed;
    }
  }

  function handleStartPauseContinue() {
    if (timerState === "idle") {
      if (secondsLeft === 0) {
        setSecondsLeft(startMinsRef.current * 60);
      }
      savedRef.current = false;
      setTimerState("running");
    } else if (timerState === "running") {
      setTimerState("paused");
    } else if (timerState === "paused") {
      setTimerState("running");
    }
  }

  function handleReset() {
    setTimerState("idle");
    setSecondsLeft(startMinsRef.current * 60);
  }

  function handleAbandon() {
    if (timerState === "idle" && secondsLeft === 0) return;
    const elapsed = startMinsRef.current - Math.ceil(secondsLeft / 60);
    if (elapsed >= 1) {
      saveMutation.mutate({
        label: focusLabel.trim() || "Focus Session",
        durationMins: elapsed,
        completed: false,
      });
    }
    handleReset();
  }
  const radius = 90;
  const totalSeconds = startMinsRef.current * 60;
  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 100;
  const mins = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const secs = (secondsLeft % 60).toString().padStart(2, "0");

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress / 100);

  const startBtnLabel =
    timerState === "idle"
      ? "Start"
      : timerState === "running"
        ? "Pause"
        : "Continue";

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold">Focus</h1>
        </div>

        {/* Focus Label Card */}
        {/* <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">
              What are you focusing on?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g. Coding, Reading, Deep Work..."
              value={focusLabel}
              onChange={(e) => setFocusLabel(e.target.value)}
              disabled={timerState !== "idle"}
              className="text-base"
            />
          </CardContent>
        </Card> */}

        {/* Timer Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">
              What are you focusing on?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g. Coding, Reading, Deep Work..."
              value={focusLabel}
              onChange={(e) => setFocusLabel(e.target.value)}
              disabled={timerState !== "idle"}
              className="text-base"
            />
          </CardContent>
          <CardContent className="pt-6 flex flex-col items-center gap-6">
            {/* Circle Timer */}
            <div className="relative flex items-center justify-center">
              <svg width="220" height="220" className="-rotate-90">
                {/* Background ring */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  // stroke="hsl(var(--muted))"
                  stroke="red"
                  strokeWidth="10"
                />

                {/* Progress ring */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  // stroke="hsl(var(--primary))"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  // style={{
                  //   transition: "stroke-dashoffset 0.35s linear",
                  // }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-mono font-bold">
                  {mins}:{secs}
                </span>
                {focusLabel && (
                  <span className="text-xs text-muted-foreground mt-1 max-w-[120px] text-center truncate">
                    {focusLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  variant={selectedMins === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyMins(p)}
                  disabled={timerState !== "idle"}
                >
                  {p} min
                </Button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={customInput}
                onChange={(e) => handleCustomInput(e.target.value)}
                disabled={timerState !== "idle"}
                className="w-20 text-center"
                min={1}
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>

            {/* Controls */}
            <div className="flex gap-3 w-full">
              <Button className="flex-1" onClick={handleStartPauseContinue}>
                {startBtnLabel}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={timerState !== "idle" ? handleAbandon : handleReset}
              >
                {timerState !== "idle" ? "Reset" : "Reset"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Log */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Today's Sessions</h2>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : sessions?.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No sessions yet today.
            </p>
          ) : (
            sessions?.map((session: any) => (
              <Card key={session.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {session.label}
                        </span>
                        <span>{session.completed ? "✅" : "❌"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.durationMins} min ·{" "}
                        {new Date(session.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-red-500"
                      onClick={() => deleteMutation.mutate(session.id)}
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

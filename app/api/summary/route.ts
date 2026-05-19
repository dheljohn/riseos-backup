import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";
import { calcSleepGaps, calcMealGap, calcFocusGaps } from "@/lib/gap";

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    // Get the start of the current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Fetch all logs for this week
    const [sleepLogs, mealLogs, focusSessions] = await Promise.all([
      prisma.sleepLog.findMany({
        where: {
          userId: auth.userId,
          createdAt: { gte: weekStart, lt: weekEnd },
        },
        orderBy: { actualBed: "asc" },
      }),
      prisma.mealLog.findMany({
        where: {
          userId: auth.userId,
          createdAt: { gte: weekStart, lt: weekEnd },
        },
        orderBy: { actualTime: "asc" },
      }),
      prisma.focusSession.findMany({
        where: {
          userId: auth.userId,
          createdAt: { gte: weekStart, lt: weekEnd },
        },
        orderBy: { actualStart: "asc" },
      }),
    ]);

    // --- Sleep summary ---
    const sleepWithGaps = sleepLogs.map((log) => ({
      ...log,
      gaps: calcSleepGaps(log),
    }));

    const avgBedGap = average(
      sleepWithGaps.map((l) => l.gaps.bedGap.diffMinutes),
    );
    const avgWakeGap = average(
      sleepWithGaps.map((l) => l.gaps.wakeGap.diffMinutes),
    );
    const avgSleepDuration = average(
      sleepWithGaps.map((l) => l.gaps.actualDurationMins),
    );
    const avgIntendedSleepDuration = average(
      sleepWithGaps.map((l) => l.gaps.intendedDurationMins),
    );

    // --- Meal summary ---
    const mealWithGaps = mealLogs.map((log) => ({
      ...log,
      gaps: calcMealGap(log),
    }));

    const mealsByType = mealWithGaps.reduce(
      (acc, log) => {
        if (!acc[log.mealType]) acc[log.mealType] = [];
        acc[log.mealType].push(log.gaps.timeGap.diffMinutes);
        return acc;
      },
      {} as Record<string, number[]>,
    );

    const avgMealGapByType = Object.entries(mealsByType).reduce(
      (acc, [type, diffs]) => {
        acc[type] = Math.round(average(diffs));
        return acc;
      },
      {} as Record<string, number>,
    );

    // --- Focus summary ---
    const focusWithGaps = focusSessions.map((session) => ({
      ...session,
      gaps: calcFocusGaps(session),
    }));

    const completedSessions = focusWithGaps.filter((s) => s.completed).length;
    const avgStartGap = average(
      focusWithGaps.map((s) => s.gaps.startGap.diffMinutes),
    );
    const avgDurationOverrun = average(
      focusWithGaps.map(
        (s) => s.gaps.actualDurationMins - s.gaps.intendedDurationMins,
      ),
    );
    const totalFocusMinutes = focusWithGaps.reduce(
      (sum, s) => sum + s.gaps.actualDurationMins,
      0,
    );

    // --- Patterns ---
    const patterns: string[] = [];

    if (avgBedGap > 30)
      patterns.push(
        `You went to bed an average of ${Math.round(avgBedGap)} min late this week.`,
      );
    if (avgBedGap < -10)
      patterns.push(
        `You went to bed an average of ${Math.round(Math.abs(avgBedGap))} min early this week.`,
      );
    if (avgSleepDuration < 420)
      patterns.push(
        `You averaged ${Math.round((avgSleepDuration / 60) * 10) / 10}h of sleep — below the recommended 7h.`,
      );
    if (avgSleepDuration >= 420)
      patterns.push(
        `You averaged ${Math.round((avgSleepDuration / 60) * 10) / 10}h of sleep this week.`,
      );
    if (avgStartGap > 20)
      patterns.push(
        `Your focus sessions started an average of ${Math.round(avgStartGap)} min late.`,
      );
    if (avgDurationOverrun > 15)
      patterns.push(
        `Your focus sessions ran ${Math.round(avgDurationOverrun)} min over on average.`,
      );
    if (completedSessions === focusSessions.length && focusSessions.length > 0)
      patterns.push(
        `You completed all ${completedSessions} focus sessions this week.`,
      );

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      sleep: {
        totalLogs: sleepLogs.length,
        avgBedGapMins: Math.round(avgBedGap),
        avgWakeGapMins: Math.round(avgWakeGap),
        avgActualDurationMins: Math.round(avgSleepDuration),
        avgIntendedDurationMins: Math.round(avgIntendedSleepDuration),
        logs: sleepWithGaps,
      },
      meals: {
        totalLogs: mealLogs.length,
        avgGapByType: avgMealGapByType,
        logs: mealWithGaps,
      },
      focus: {
        totalSessions: focusSessions.length,
        completedSessions,
        totalFocusMinutes,
        avgStartGapMins: Math.round(avgStartGap),
        avgDurationOverrunMins: Math.round(avgDurationOverrun),
        sessions: focusWithGaps,
      },
      patterns,
    });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

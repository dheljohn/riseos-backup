import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    // Start of current week (Monday)
    const now = new Date();

    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Fetch all logs
    const [sleepLogs, mealLogs, focusSessions] = await Promise.all([
      prisma.sleepLog.findMany({
        where: {
          userId: auth.userId,
          createdAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.mealLog.findMany({
        where: {
          userId: auth.userId,
          createdAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.focusSession.findMany({
        where: {
          userId: auth.userId,
          createdAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    // =========================
    // Sleep Summary
    // =========================

    const avgSleepHours = average(sleepLogs.map((log) => log.durationHrs));

    const avgEnergyLevel = average(sleepLogs.map((log) => log.energyLevel));

    // =========================
    // Meal Summary
    // =========================

    const totalCalories = mealLogs.reduce(
      (sum, meal) => sum + (meal.calories ?? 0),
      0,
    );

    const mealsByType = mealLogs.reduce(
      (acc, meal) => {
        acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // =========================
    // Focus Summary
    // =========================

    const completedSessions = focusSessions.filter((s) => s.completed).length;

    const totalFocusMinutes = focusSessions.reduce(
      (sum, s) => sum + s.durationMins,
      0,
    );

    const avgSessionDuration = average(
      focusSessions.map((s) => s.durationMins),
    );

    const longestSession =
      focusSessions.length > 0
        ? Math.max(...focusSessions.map((s) => s.durationMins))
        : 0;

    const completionRate =
      focusSessions.length > 0
        ? (completedSessions / focusSessions.length) * 100
        : 0;

    // =========================
    // Patterns / Insights
    // =========================

    const patterns: string[] = [];

    // Sleep insights
    if (avgSleepHours < 6) {
      patterns.push(
        `You averaged only ${avgSleepHours.toFixed(1)}h of sleep this week.`,
      );
    }

    if (avgSleepHours >= 7) {
      patterns.push(
        `You averaged ${avgSleepHours.toFixed(1)}h of sleep this week.`,
      );
    }

    if (avgEnergyLevel >= 4) {
      patterns.push(`Your average energy level was high this week.`);
    }

    if (avgEnergyLevel <= 2 && sleepLogs.length > 0) {
      patterns.push(`Your energy levels were consistently low this week.`);
    }

    // Meal insights
    if (mealLogs.length >= 21) {
      patterns.push(`You logged meals consistently throughout the week.`);
    }

    if (totalCalories > 14000) {
      patterns.push(
        `Your total logged calorie intake was ${totalCalories} kcal this week.`,
      );
    }

    // Focus insights
    if (completionRate === 100 && focusSessions.length > 0) {
      patterns.push(
        `You completed all ${completedSessions} focus sessions this week.`,
      );
    }

    if (completionRate >= 70 && completionRate < 100) {
      patterns.push(
        `You completed ${Math.round(completionRate)}% of your focus sessions.`,
      );
    }

    if (completionRate < 50 && focusSessions.length > 0) {
      patterns.push(`Less than half of your focus sessions were completed.`);
    }

    if (avgSessionDuration >= 60) {
      patterns.push(
        `Your average focus session lasted ${Math.round(avgSessionDuration)} minutes.`,
      );
    }

    if (longestSession >= 120) {
      patterns.push(
        `Your longest focus session lasted ${longestSession} minutes.`,
      );
    }

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),

      sleep: {
        totalLogs: sleepLogs.length,

        avgSleepHours: Number(avgSleepHours.toFixed(1)),

        avgEnergyLevel: Number(avgEnergyLevel.toFixed(1)),

        logs: sleepLogs,
      },

      meals: {
        totalLogs: mealLogs.length,

        totalCalories,

        mealsByType,

        logs: mealLogs,
      },

      focus: {
        totalSessions: focusSessions.length,

        completedSessions,

        completionRate: Math.round(completionRate),

        totalFocusMinutes,

        avgSessionDurationMins: Math.round(avgSessionDuration),

        longestSessionMins: longestSession,

        sessions: focusSessions,
      },

      patterns,
    });
  } catch (error) {
    console.error("Summary error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;

  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

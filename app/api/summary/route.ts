import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";
import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  format,
  isSameDay,
  subDays,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    // Start of current week (Monday)
    const timezone = req.nextUrl.searchParams.get("timezone") || "UTC";

    // Current date in user's timezone
    const now = toZonedTime(new Date(), timezone);

    const sevenDaysAgo = subDays(now, 6);

    // Today boundaries in user's timezone
    // const todayLogDay = format(toZonedTime(new Date(), timezone), "yyyy-MM-dd");
    const isToday = (date: Date) => isSameDay(date, new Date());
    const weekStart = toZonedTime(
      startOfWeek(now, { weekStartsOn: 1 }),
      timezone,
    );

    const weekEnd = toZonedTime(endOfWeek(now, { weekStartsOn: 1 }), timezone);

    // Fetch all logs
    const [user, sleepLogs, mealLogs, focusSessions] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: auth.userId,
        },
        select: {
          currentStreak: true,
          longestStreak: true,
          lastActiveDate: true,
          name: true,
        },
      }),
      prisma.sleepLog.findMany({
        where: {
          userId: auth.userId,
          logDay: {
            gte: startOfDay(sevenDaysAgo),
            lt: endOfDay(now),
          },
        },
        orderBy: {
          logDay: "desc",
        },
      }),

      prisma.mealLog.findMany({
        where: {
          userId: auth.userId,
          logDay: {
            gte: startOfDay(sevenDaysAgo),
            lt: endOfDay(now),
          },
        },
        orderBy: {
          logDay: "desc",
        },
      }),

      prisma.focusSession.findMany({
        where: {
          userId: auth.userId,
          logDay: {
            gte: startOfDay(sevenDaysAgo),
            lt: endOfDay(now),
          },
        },
        orderBy: {
          logDay: "desc",
        },
      }),
    ]);

    // =========================
    // USER SUMMARY
    // =========================

    // =========================
    // Sleep Summary
    // =========================
    const todaySleepLog = sleepLogs.filter((log) => isToday(log.logDay));

    const todaySleepDur =
      todaySleepLog.reduce((sum, log) => sum + log.durationHrs, 0) ?? 0;

    const todayEnergy =
      todaySleepLog.reduce((sum, log) => sum + log.energyLevel, 0) ?? 0;

    // if multiple sleep
    const todayAvgEnergy =
      todaySleepLog.length > 0
        ? todaySleepLog.reduce((sum, log) => sum + log.energyLevel, 0) /
          todaySleepLog.length
        : 0;

    const avgSleepHours = average(sleepLogs.map((log) => log.durationHrs));

    const avgEnergyLevel = average(sleepLogs.map((log) => log.energyLevel));

    // =========================
    // Meal Summary
    // =========================

    const totalCalories = mealLogs.reduce(
      (sum, meal) => sum + (meal.calories ?? 0),
      0,
    );

    const todayMeals = mealLogs.filter((log) => isToday(log.logDay));

    const todayCalories = todayMeals.reduce(
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

    const todayFocusSession = focusSessions.filter((log) =>
      isToday(log.logDay),
    );

    const totalFocusMinutes = todayFocusSession.reduce(
      (sum, s) => sum + (s.durationMins || 0),
      0,
    );

    const totalFocusToday = todayFocusSession.length;

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

    // =========================
    // Sleep Patterns
    // =========================
    if (sleepLogs.length === 0) {
      patterns.push("No sleep logs this week. Start tracking to get insights.");
    } else {
      if (avgSleepHours < 6)
        patterns.push(
          `You're averaging only ${avgSleepHours.toFixed(1)}h of sleep — below the recommended 7–9h.`,
        );
      else if (avgSleepHours >= 7 && avgSleepHours <= 9)
        patterns.push(
          `Solid sleep week — you averaged ${avgSleepHours.toFixed(1)}h per night.`,
        );
      else if (avgSleepHours > 9)
        patterns.push(
          `You averaged ${avgSleepHours.toFixed(1)}h of sleep — slightly over the recommended range.`,
        );

      if (avgEnergyLevel >= 4)
        patterns.push(
          "Your energy levels were high this week — great recovery.",
        );
      else if (avgEnergyLevel <= 2)
        patterns.push(
          "Your energy was consistently low this week. Consider improving sleep quality or duration.",
        );

      // Sleep consistency — check variance
      if (sleepLogs.length >= 3) {
        const durations = sleepLogs.map((l) => l.durationHrs);
        const mean = average(durations);
        const variance = average(durations.map((d) => Math.pow(d - mean, 2)));
        const stdDev = Math.sqrt(variance);
        if (stdDev > 1.5)
          patterns.push(
            "Your sleep duration varies a lot day to day — a more consistent schedule may help your energy.",
          );
        else if (stdDev <= 0.5 && sleepLogs.length >= 4)
          patterns.push(
            "Your sleep schedule is very consistent this week — that's great for your body clock.",
          );
      }

      // Today's sleep
      if (todaySleepLog.length > 0) {
        if (todaySleepDur < 5)
          patterns.push(
            `You only got ${todaySleepDur}h last night — consider an early night tonight.`,
          );
        else if (todayAvgEnergy >= 4)
          patterns.push(
            "You woke up with high energy today — your sleep paid off.",
          );
        else if (todayAvgEnergy <= 2)
          patterns.push(
            "Low energy today despite logging sleep — quality may be the issue.",
          );
      }
    }

    // =========================
    // Meal Patterns
    // =========================
    if (mealLogs.length === 0) {
      patterns.push(
        "No meals logged this week. Track your meals to see nutrition insights.",
      );
    } else {
      const expectedMeals = 21; // 3 meals/day × 7 days
      const logRate = (mealLogs.length / expectedMeals) * 100;

      if (logRate >= 80)
        patterns.push(
          "You've been consistently logging meals this week — great habit.",
        );
      else if (logRate < 40)
        patterns.push(
          "You're only logging a fraction of your meals. More logs means better insights.",
        );

      if (todayCalories > 0 && todayCalories < 1200)
        patterns.push(
          `Only ${todayCalories} kcal logged today — make sure you're eating enough.`,
        );
      else if (todayCalories > 2500)
        patterns.push(
          `You've logged ${todayCalories} kcal today — higher than average intake.`,
        );

      const hasBreakfast = mealLogs.some((m) => m.mealType === "breakfast");
      if (!hasBreakfast)
        patterns.push(
          "No breakfast logged this week — starting the day with a meal can improve focus.",
        );

      if (mealsByType["snack"] >= 10)
        patterns.push(
          "You logged a lot of snacks this week — check if they're nutrient-dense.",
        );
    }

    // =========================
    // Focus Patterns
    // =========================
    if (focusSessions.length === 0) {
      patterns.push(
        "No focus sessions this week. Try a session to build your streak.",
      );
    } else {
      if (completionRate === 100)
        patterns.push(
          `Perfect focus week — all ${completedSessions} sessions completed.`,
        );
      else if (completionRate >= 70)
        patterns.push(
          `You completed ${Math.round(completionRate)}% of your focus sessions — strong week.`,
        );
      else if (completionRate < 50)
        patterns.push(
          `Less than half your focus sessions were completed. Try shorter sessions to build momentum.`,
        );

      if (avgSessionDuration >= 90)
        patterns.push(
          `You're doing deep work — averaging ${Math.round(avgSessionDuration)} min sessions.`,
        );
      else if (avgSessionDuration < 25)
        patterns.push(
          "Your focus sessions are quite short. Try building up to 25–50 min blocks.",
        );

      if (longestSession >= 120)
        patterns.push(
          `Your longest session was ${longestSession} min — impressive sustained focus.`,
        );

      if (totalFocusMinutes >= 300)
        patterns.push(
          `You focused for ${totalFocusMinutes} min today — that's ${(totalFocusMinutes / 60).toFixed(1)}h of deep work.`,
        );
    }

    // =========================
    // Cross-category Patterns
    // =========================
    if (todaySleepDur < 6 && totalFocusMinutes > 120)
      patterns.push(
        "You're pushing through focus sessions on low sleep — sustainable short term, but rest matters.",
      );

    if (avgEnergyLevel >= 4 && completionRate >= 80)
      patterns.push(
        "High energy + high focus completion — you're in a great rhythm this week.",
      );

    if (todayCalories > 0 && todayCalories < 1200 && totalFocusMinutes > 60)
      patterns.push(
        "Low calorie intake with active focus sessions — make sure you're fueling your brain.",
      );

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),

      user: {
        currentStreak: user?.currentStreak ?? 0,
        longestStreak: user?.longestStreak ?? 0,
        name: user?.name ?? "User",
      },

      sleep: {
        totalLogs: sleepLogs.length,

        todayEnergyLevel: Number(todayEnergy.toFixed(1)),

        todaySleepDur: todaySleepDur,

        todayAvgEnergy: Number(todayAvgEnergy.toFixed(1)),

        avgSleepHours: Number(avgSleepHours.toFixed(1)),

        avgEnergyLevel: Number(avgEnergyLevel.toFixed(1)),

        logs: sleepLogs,
      },

      meals: {
        totalLogs: mealLogs.length,

        todaysMeals: todayMeals.length,

        totalCalories,

        mealsByType,

        logs: mealLogs,

        todayCalories: Number(todayCalories.toFixed(1)),
      },

      focus: {
        totalSessions: focusSessions.length,

        todaySessions: todayFocusSession.length,
        todayFocusSessions: todayFocusSession,

        completedSessions,

        completionRate: Math.round(completionRate),

        totalFocusMinutes,
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

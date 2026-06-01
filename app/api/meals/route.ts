import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  subDays,
} from "date-fns";
import { updateUserStreak } from "@/lib/streak";
import { toZonedTime } from "date-fns-tz";

// =========================
// GET Meals (weekly)
// =========================

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  const timezone = req.nextUrl.searchParams.get("timezone") || "UTC";

  const now = toZonedTime(new Date(), timezone);

  const sevenDaysAgo = subDays(now, 6);

  // const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  // const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const meals = await prisma.mealLog.findMany({
    where: {
      userId: auth.userId,
      logDay: {
        gte: startOfDay(sevenDaysAgo),
        lte: endOfDay(now),
      },
    },
    orderBy: {
      logDay: "desc",
    },
  });

  return NextResponse.json(meals);
}

// =========================
// POST Meal
// =========================

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    const { mealType, name, calories, logDay: inputLogDay } = await req.json();

    if (!mealType || !name) {
      return NextResponse.json(
        { error: "mealType and name are required" },
        { status: 400 },
      );
    }

    // Normalize logDay exactly like SleepLog
    const logDay = inputLogDay
      ? startOfDay(new Date(inputLogDay))
      : startOfDay(new Date());

    const meal = await prisma.mealLog.create({
      data: {
        userId: auth.userId,
        mealType,
        name,
        logDay,
        calories: calories != null ? Number(calories) : null,
      },
    });

    await updateUserStreak(auth.userId, logDay);

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error("Meal POST error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

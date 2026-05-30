import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { updateUserStreak } from "@/lib/streak";

// =========================
// GET Focus Sessions (weekly)
// =========================

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  const timezone = req.nextUrl.searchParams.get("timezone") || "UTC";

  const now = toZonedTime(new Date(), timezone);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId: auth.userId,
      logDay: {
        gte: startOfDay(weekStart),
        lte: endOfDay(weekEnd),
      },
    },
    orderBy: {
      logDay: "desc",
    },
  });

  return NextResponse.json(sessions);
}

// =========================
// POST Focus Session
// =========================

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    const {
      label,
      durationMins,
      completed,
      logDay: inputLogDay,
    } = await req.json();

    if (!label || durationMins == null) {
      return NextResponse.json(
        { error: "label and durationMins are required" },
        { status: 400 },
      );
    }

    // Normalize logDay (same as Sleep + Meals)
    const logDay = inputLogDay
      ? startOfDay(new Date(inputLogDay))
      : startOfDay(new Date());

    const session = await prisma.focusSession.create({
      data: {
        userId: auth.userId,
        label,
        durationMins: Number(durationMins),
        completed: completed ?? false,
        logDay,
      },
    });

    await updateUserStreak(auth.userId, logDay);

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Focus POST error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { updateUserStreak } from "@/lib/streak";

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  const timezone = req.nextUrl.searchParams.get("timezone") || "UTC";

  const now = toZonedTime(new Date(), timezone);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const logs = await prisma.sleepLog.findMany({
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

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    const { durationHrs, energyLevel, logDay: inputLogDay } = await req.json();

    if (durationHrs == null || energyLevel == null) {
      return NextResponse.json(
        { error: "durationHrs and energyLevel are required" },
        { status: 400 },
      );
    }

    // normalize logDay to FULL DAY RANGE SAFETY
    const logDay = inputLogDay
      ? startOfDay(new Date(inputLogDay))
      : startOfDay(new Date());

    const sleepLog = await prisma.sleepLog.create({
      data: {
        userId: auth.userId,
        logDay,
        durationHrs: Number(durationHrs),
        energyLevel: Number(energyLevel),
      },
    });

    await updateUserStreak(auth.userId, logDay);

    return NextResponse.json(sleepLog, { status: 201 });
  } catch (error) {
    console.error("Sleep POST error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

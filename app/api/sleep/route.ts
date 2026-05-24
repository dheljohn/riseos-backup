import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";
import { format } from "date-fns";
import { updateUserStreak } from "@/lib/streak";

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  const logs = await prisma.sleepLog.findMany({
    where: {
      userId: auth.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);

  if (!auth) return unauthorized();

  try {
    const { durationHrs, energyLevel, logDay: inputLogDay } = await req.json();
    if (!durationHrs || !energyLevel) {
      return NextResponse.json(
        { error: "durationHrs and energyLevel are required" },
        { status: 400 },
      );
    }
    const logDay = inputLogDay ?? format(new Date(), "yyyy-MM-dd");

    const sleeplog = await prisma.sleepLog.create({
      data: {
        userId: auth.userId,
        logDay,
        durationHrs: Number(durationHrs),
        energyLevel: Number(energyLevel),
      },
    });
    await updateUserStreak(auth.userId, logDay);

    return NextResponse.json(sleeplog, { status: 201 });
  } catch (error) {
    console.error("Sleep POST error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

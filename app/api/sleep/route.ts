import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";
import { calcSleepGaps } from "@/lib/gap";

// export async function GET(req: NextRequest) {
//   const auth = getAuthPayload(req);
//   if (!auth) return unauthorized();

//   const logs = await prisma.sleepLog.findMany({
//     where: { userId: auth.userId },
//     orderBy: { actualBed: "desc" },
//   });

//   return NextResponse.json(logs);
// }
export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  const logs = await prisma.sleepLog.findMany({
    where: { userId: auth.userId },
    orderBy: { actualBed: "desc" },
  });

  const withGaps = logs.map((log) => ({
    ...log,
    gaps: calcSleepGaps(log),
  }));

  return NextResponse.json(withGaps);
}

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    const { intendedBed, actualBed, intendedWake, actualWake, quality, notes } =
      await req.json();

    if (!intendedBed || !actualBed || !intendedWake || !actualWake) {
      return NextResponse.json(
        {
          error:
            "intendedBed, actualBed, intendedWake, actualWake are required",
        },
        { status: 400 },
      );
    }

    const log = await prisma.sleepLog.create({
      data: {
        userId: auth.userId,
        intendedBed: new Date(intendedBed),
        actualBed: new Date(actualBed),
        intendedWake: new Date(intendedWake),
        actualWake: new Date(actualWake),
        quality: quality ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Sleep POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";

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
    const { durationHrs, energyLevel } = await req.json();

    if (!durationHrs || !energyLevel) {
      return NextResponse.json(
        { error: "durationHrs and energyLevel are required" },
        { status: 400 },
      );
    }

    const log = await prisma.sleepLog.create({
      data: {
        userId: auth.userId,
        durationHrs: Number(durationHrs),
        energyLevel: Number(energyLevel),
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

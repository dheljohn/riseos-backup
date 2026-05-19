import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";
import { calcMealGap } from "@/lib/gap";

// export async function GET(req: NextRequest) {
//   const auth = getAuthPayload(req);
//   if (!auth) return unauthorized();

//   const logs = await prisma.mealLog.findMany({
//     where: { userId: auth.userId },
//     orderBy: { actualTime: "desc" },
//   });

//   return NextResponse.json(logs);
// }
export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  const logs = await prisma.mealLog.findMany({
    where: { userId: auth.userId },
    orderBy: { actualTime: "desc" },
  });

  const withGaps = logs.map((log) => ({
    ...log,
    gaps: calcMealGap(log),
  }));

  return NextResponse.json(withGaps);
}

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    const { mealType, intendedTime, actualTime, description } =
      await req.json();

    if (!mealType || !intendedTime || !actualTime) {
      return NextResponse.json(
        { error: "mealType, intendedTime, actualTime are required" },
        { status: 400 },
      );
    }

    const log = await prisma.mealLog.create({
      data: {
        userId: auth.userId,
        mealType,
        intendedTime: new Date(intendedTime),
        actualTime: new Date(actualTime),
        description: description ?? null,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Meal POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId: auth.userId,
      createdAt: { gte: today, lt: tomorrow },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    const { label, durationMins, completed } = await req.json();

    if (!label || durationMins == null) {
      return NextResponse.json(
        { error: "label and durationMins are required" },
        { status: 400 },
      );
    }

    const session = await prisma.focusSession.create({
      data: {
        userId: auth.userId,
        label,
        durationMins: Number(durationMins),
        completed: completed ?? false,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Focus POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

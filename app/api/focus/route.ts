import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";
import { calcFocusGaps } from "@/lib/gap";

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  const sessions = await prisma.focusSession.findMany({
    where: { userId: auth.userId },
    orderBy: { actualStart: "desc" },
  });

  const withGaps = sessions.map((session) => ({
    ...session,
    gaps: calcFocusGaps(session),
  }));

  return NextResponse.json(withGaps);
}

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    const {
      title,
      intendedStart,
      actualStart,
      intendedDurationMins,
      actualDurationMins,
      completed,
      notes,
    } = await req.json();

    if (
      !title ||
      !intendedStart ||
      !actualStart ||
      intendedDurationMins == null ||
      actualDurationMins == null
    ) {
      return NextResponse.json(
        {
          error:
            "title, intendedStart, actualStart, intendedDurationMins, actualDurationMins are required",
        },
        { status: 400 },
      );
    }

    const session = await prisma.focusSession.create({
      data: {
        userId: auth.userId,
        title,
        intendedStart: new Date(intendedStart),
        actualStart: new Date(actualStart),
        intendedDurationMins: Number(intendedDurationMins),
        actualDurationMins: Number(actualDurationMins),
        completed: completed ?? false,
        notes: notes ?? null,
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

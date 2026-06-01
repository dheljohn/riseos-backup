import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthPayload(req);
    if (!auth) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    if (!user) return unauthorized();

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

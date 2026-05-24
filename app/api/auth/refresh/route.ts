import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

function clearAuthAnd401(message: string) {
  const res = NextResponse.json({ error: message }, { status: 401 });

  res.cookies.set("refreshToken", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = req.cookies.get("refreshToken")?.value ?? body.refreshToken;

    if (!token) {
      return clearAuthAnd401("No refresh token");
    }

    let payload: { userId: string };

    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
        userId: string;
      };
    } catch {
      return clearAuthAnd401("Invalid refresh token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return clearAuthAnd401("User not found");
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return clearAuthAnd401("Refresh token expired or revoked");
    }

    const accessToken = jwt.sign(
      { userId: payload.userId },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );

    return NextResponse.json({
      accessToken,
      userId: payload.userId,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

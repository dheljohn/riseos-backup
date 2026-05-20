import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = req.cookies.get("refreshToken")?.value ?? body.refreshToken;

    if (!token) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    // Verify signature
    let payload: { userId: string };
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
        userId: string;
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 },
      );
    }

    // Check it exists in DB (not logged out)
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Refresh token expired or revoked" },
        { status: 401 },
      );
    }

    // Issue new access token
    const accessToken = jwt.sign(
      { userId: payload.userId },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );

    return NextResponse.json({ accessToken }, { status: 200 });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

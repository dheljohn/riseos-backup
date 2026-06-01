import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

function clearAuthAnd401(message: string) {
  const res = NextResponse.json({ error: message }, { status: 401 });

  // res.cookies.set("refreshToken", "", {
  //   httpOnly: true,
  //   path: "/",
  //   maxAge: 0,
  // });

  return res;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed, retryAfter } = rateLimit(ip, 10, 60 * 1000); // 10 requests/min

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter}s` },
      { status: 429 },
    );
  }
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

    const stored = await prisma.refreshToken.findFirst({
      where: { token },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return clearAuthAnd401("Refresh token expired or revoked");
    }

    const accessToken = jwt.sign(
      { userId: payload.userId },
      process.env.JWT_SECRET!,
      { expiresIn: "30s" },
    );
    const newRefreshToken = jwt.sign(
      { userId: payload.userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" },
    );

    console.log("Old token expiry:", jwt.decode(token));
    console.log("New token expiry:", jwt.decode(newRefreshToken));

    await prisma.$transaction([
      prisma.refreshToken.deleteMany({
        where: { token },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: payload.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken, // ← send new refresh token
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

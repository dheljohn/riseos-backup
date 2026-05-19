import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("refreshToken")?.value;

    if (token) {
      // Delete from DB — ignore if already gone
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

    const response = NextResponse.json(
      { message: "Logged out" },
      { status: 200 },
    );

    // Clear the cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "strict",
      secure: true,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

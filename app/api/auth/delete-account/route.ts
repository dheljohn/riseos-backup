import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthPayload(req);
    if (!auth) return unauthorized();

    // Confirm the user exists 
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) return unauthorized();

    // Deleting the user cascades to the ff:
    //   RefreshToken, SleepLog, MealLog, FocusSession
    await prisma.user.delete({
      where: { id: auth.userId },
    });

    // Clear the refresh token cookie if present (web clients)
    const response = NextResponse.json(
      { message: "Account deleted" },
      { status: 200 },
    );

    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "strict",
      secure: true,
    });

    return response;
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

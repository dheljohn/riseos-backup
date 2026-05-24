import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rateLimit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed, retryAfter } = rateLimit(ip, 10, 60 * 1000); // 10 requests/min

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter}s` },
      { status: 429 },
    );
  }
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return Response.json(
        { error: "Name, email and password are required" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return Response.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Save user to database
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return Response.json(
      {
        message: "User registered successfully",
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return Response.json(
      {
        error: "Something went wrong",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

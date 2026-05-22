import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";

// =========================
// GET Meals
// =========================

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);

  if (!auth) return unauthorized();

  // Today's range
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);

  tomorrow.setDate(tomorrow.getDate() + 1);

  const meals = await prisma.mealLog.findMany({
    where: {
      userId: auth.userId,

      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(meals);
}

// =========================
// POST Meal
// =========================

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);

  if (!auth) return unauthorized();

  try {
    const { mealType, name, calories } = await req.json();

    if (!mealType || !name) {
      return NextResponse.json(
        {
          error: "mealType and Mealname are required",
        },
        {
          status: 400,
        },
      );
    }

    const meal = await prisma.mealLog.create({
      data: {
        userId: auth.userId,

        mealType,

        name,

        calories: calories != null ? Number(calories) : null,
      },
    });

    return NextResponse.json(meal, {
      status: 201,
    });
  } catch (error) {
    console.error("Meal POST error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}

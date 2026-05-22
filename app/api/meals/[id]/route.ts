import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";

// =========================
// PATCH Meal
// =========================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthPayload(req);

  if (!auth) return unauthorized();

  try {
    const { id } = await params;

    const body = await req.json();

    // Check ownership
    const existing = await prisma.mealLog.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.mealLog.update({
      where: { id },

      data: {
        ...(body.mealType && {
          mealType: body.mealType,
        }),

        ...(body.name && {
          name: body.name,
        }),

        ...(body.calories !== undefined && {
          calories: body.calories != null ? Number(body.calories) : null,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Meal PATCH error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// =========================
// DELETE Meal
// =========================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthPayload(req);

  if (!auth) return unauthorized();

  try {
    const { id } = await params;

    // Check ownership
    const existing = await prisma.mealLog.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.mealLog.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Meal deleted",
    });
  } catch (error) {
    console.error("Meal DELETE error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

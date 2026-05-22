import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, unauthorized } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.focusSession.findUnique({ where: { id } });
    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.focusSession.update({
      where: { id },
      data: {
        ...(body.label && { label: body.label }),
        ...(body.durationMins !== undefined && {
          durationMins: Number(body.durationMins),
        }),
        ...(body.completed !== undefined && { completed: body.completed }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Focus PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthPayload(req);
  if (!auth) return unauthorized();

  try {
    const { id } = await params;

    const existing = await prisma.focusSession.findUnique({ where: { id } });
    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.focusSession.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Focus DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    // Make sure this log belongs to the user
    const existing = await prisma.sleepLog.findUnique({ where: { id } });
    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.sleepLog.update({
      where: { id },
      data: {
        ...(body.intendedBed && { intendedBed: new Date(body.intendedBed) }),
        ...(body.actualBed && { actualBed: new Date(body.actualBed) }),
        ...(body.intendedWake && { intendedWake: new Date(body.intendedWake) }),
        ...(body.actualWake && { actualWake: new Date(body.actualWake) }),
        ...(body.quality !== undefined && { quality: body.quality }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Sleep PATCH error:", error);
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

    const existing = await prisma.sleepLog.findUnique({ where: { id } });
    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.sleepLog.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Sleep DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

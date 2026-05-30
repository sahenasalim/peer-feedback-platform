import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGroupSchema } from "@/lib/validators";

export async function GET() {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const group = await prisma.group.create({ data: { name: parsed.data.name } });
  return NextResponse.json({ group }, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMemberSchema } from "@/lib/validators";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const member = await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: parsed.data.userId, groupId: params.id } },
    update: {},
    create: { userId: parsed.data.userId, groupId: params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ member }, { status: 201 });
}

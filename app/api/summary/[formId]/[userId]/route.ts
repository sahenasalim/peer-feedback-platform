import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { formId: string; userId: string } }) {
  const summary = await prisma.aISummary.findUnique({
    where: { formId_targetUserId: { formId: params.formId, targetUserId: params.userId } },
    include: {
      form: { select: { id: true, title: true } },
      targetUser: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ summary });
}

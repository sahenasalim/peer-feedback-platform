import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFormSchema } from "@/lib/validators";

export async function GET() {
  const forms = await prisma.feedbackForm.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      group: {
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      },
      submissions: { select: { targetUserId: true, rating: true } },
      summaries: true,
    },
  });
  return NextResponse.json({ forms });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const form = await prisma.feedbackForm.create({
    data: { groupId: parsed.data.groupId, title: parsed.data.title, isOpen: true },
  });

  return NextResponse.json({ form }, { status: 201 });
}

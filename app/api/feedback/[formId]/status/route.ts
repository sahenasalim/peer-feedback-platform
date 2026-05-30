import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { formId: string } }) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ message: "Missing userId" }, { status: 400 });

  const form = await prisma.feedbackForm.findUnique({
    where: { id: params.formId },
    include: {
      group: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      submissions: {
        where: { submittedByUserId: userId },
        select: { targetUserId: true },
      },
    },
  });
  if (!form) return NextResponse.json({ message: "Form not found" }, { status: 404 });

  const isMember = form.group.members.some((member) => member.userId === userId);
  if (!isMember) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const teammates = form.group.members
    .filter((member) => member.userId !== userId)
    .map((member) => member.user);
  const reviewedTargetIds = form.submissions.map((submission) => submission.targetUserId);

  return NextResponse.json({
    form: {
      id: form.id,
      title: form.title,
      isOpen: form.isOpen,
      groupName: form.group.name,
    },
    teammates,
    reviewedTargetIds,
    reviewedCount: reviewedTargetIds.length,
    totalTargets: teammates.length,
    alreadySubmitted: reviewedTargetIds.length >= teammates.length && teammates.length > 0,
  });
}

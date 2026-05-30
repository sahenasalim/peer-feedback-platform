import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitFeedbackSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = submitFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const form = await prisma.feedbackForm.findUnique({
    where: { id: parsed.data.formId },
    include: { group: { include: { members: true } } },
  });
  if (!form) return NextResponse.json({ message: "Form not found" }, { status: 404 });
  if (!form.isOpen) return NextResponse.json({ message: "This feedback form is closed" }, { status: 400 });

  const currentMembership = form.group.members.find((member) => member.userId === parsed.data.submittedByUserId);
  if (!currentMembership) {
    return NextResponse.json({ message: "You are not a member of this form's group" }, { status: 403 });
  }

  const targetIds = form.group.members
    .map((member) => member.userId)
    .filter((userId) => userId !== parsed.data.submittedByUserId)
    .sort();
  const submittedTargetIds = parsed.data.feedback.map((entry) => entry.targetUserId).sort();
  const hasExactTargets =
    targetIds.length === submittedTargetIds.length &&
    targetIds.every((targetId, index) => targetId === submittedTargetIds[index]);

  if (!hasExactTargets) {
    return NextResponse.json({ message: "Feedback must be submitted for every teammate exactly once" }, { status: 400 });
  }

  const existing = await prisma.feedbackSubmission.findFirst({
    where: { formId: form.id, submittedByUserId: parsed.data.submittedByUserId },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ message: "You've already submitted feedback for this form" }, { status: 409 });
  }

  // ANONYMITY: submittedByUserId is write-only for students
  await prisma.$transaction(
    parsed.data.feedback.map((entry) =>
      prisma.feedbackSubmission.create({
        data: {
          formId: form.id,
          submittedByUserId: parsed.data.submittedByUserId,
          targetUserId: entry.targetUserId,
          rating: entry.rating,
          strengths: entry.strengths,
          improvements: entry.improvements,
        },
      }),
    ),
  );

  return NextResponse.json({ message: "Feedback submitted successfully" }, { status: 201 });
}

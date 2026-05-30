import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { patchFormSchema } from "@/lib/validators";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = patchFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const form = await prisma.feedbackForm.update({
    where: { id: params.id },
    data: { isOpen: parsed.data.isOpen },
  });
  return NextResponse.json({ form });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.feedbackForm.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "Form deleted" });
}

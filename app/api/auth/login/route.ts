import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true, name: true, email: true, role: true, password: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(body.password, user.password);
  if (!passwordMatch) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  // Never send password back to client
  const { password: _, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
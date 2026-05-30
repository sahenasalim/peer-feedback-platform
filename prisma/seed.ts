import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(name: string, email: string, role: string, password: string) {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, password: hashed },
    create: { name, email, role, password: hashed },
  });
}

async function main() {
  // Create admin user
  await upsertUser("Admin", "admin@demo.com", "ADMIN", "admin123");

  // Create demo group
  const group = await prisma.group.upsert({
    where: { id: "seed-cs-group-a" },
    update: { name: "CS Group A" },
    create: { id: "seed-cs-group-a", name: "CS Group A" },
  });

  // Create students
  const students = await Promise.all([
    upsertUser("Alice Nguyen", "alice@demo.com", "STUDENT", "alice123"),
    upsertUser("Bob Patel", "bob@demo.com", "STUDENT", "bob123"),
    upsertUser("Carol Smith", "carol@demo.com", "STUDENT", "carol123"),
    upsertUser("Dave Chen", "dave@demo.com", "STUDENT", "dave123"),
  ]);

  // Add students to group
  for (const student of students) {
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId: student.id, groupId: group.id } },
      update: {},
      create: { userId: student.id, groupId: group.id },
    });
  }

  // Create feedback form
  const existingForm = await prisma.feedbackForm.findFirst({
    where: { groupId: group.id, title: "Sprint 1 Peer Review" },
  });

  if (existingForm) {
    await prisma.feedbackForm.update({
      where: { id: existingForm.id },
      data: { isOpen: true },
    });
  } else {
    await prisma.feedbackForm.create({
      data: { groupId: group.id, title: "Sprint 1 Peer Review", isOpen: true },
    });
  }

  console.log("✅ Seeded: 1 admin, 4 students, 1 group, 1 feedback form");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
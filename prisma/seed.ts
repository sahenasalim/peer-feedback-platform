import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertUser(name: string, email: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: { name, email },
  });
}

async function main() {
  const group = await prisma.group.upsert({
    where: { id: "seed-cs-group-a" },
    update: { name: "CS Group A" },
    create: { id: "seed-cs-group-a", name: "CS Group A" },
  });

  const students = await Promise.all([
    upsertUser("Alice Nguyen", "alice@demo.com"),
    upsertUser("Bob Patel", "bob@demo.com"),
    upsertUser("Carol Smith", "carol@demo.com"),
    upsertUser("Dave Chen", "dave@demo.com"),
  ]);

  for (const student of students) {
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId: student.id, groupId: group.id } },
      update: {},
      create: { userId: student.id, groupId: group.id },
    });
  }

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

// Promote an existing user to ADMIN.
// Usage: npm run make-admin -- <email>
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}

try {
  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { role: "ADMIN" },
  });
  console.log(`Promoted ${user.email} to ADMIN`);
} catch (e) {
  console.error("Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

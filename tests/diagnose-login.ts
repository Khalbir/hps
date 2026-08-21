import { POST } from "../src/app/api/auth/login/route";
import { prisma } from "../src/lib/db";
import { compare } from "bcryptjs";

async function test() {
  console.log("=== 1. Checking User in PostgreSQL Database ===");
  const user = await prisma.user.findFirst({
    where: { email: { equals: "khaleid.kabir@gmail.com", mode: "insensitive" } },
    include: { professional: true }
  });
  console.log("User record found:", user ? {
    id: user.id,
    email: user.email,
    name: user.firstName + " " + user.lastName,
    role: user.role,
    isVerified: user.isVerified,
    hasPassword: Boolean(user.password),
    passwordHash: user.password,
    pro: user.professional ? {
      id: user.professional.id,
      verificationStatus: user.professional.verificationStatus,
      digitalId: user.professional.digitalId
    } : null
  } : "NOT FOUND");

  if (user && user.password) {
    const isMatch = await compare("Chinedu2019!", user.password);
    console.log("Password 'Chinedu2019!' bcrypt match:", isMatch);
  }

  console.log("\n=== 2. Simulating /api/auth/login POST Request ===");
  try {
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "khaleid.kabir@gmail.com",
        password: "Chinedu2019!"
      })
    });
    const res = await POST(req);
    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response body:", text);
  } catch (err: any) {
    console.error("API POST threw exception:", err);
  }

  await prisma.$disconnect();
  process.exit(0);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});

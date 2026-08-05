import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const allowedRoles = ["CREATOR", "EDITOR"] as const;

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(allowedRoles).default("CREATOR"),
});

export async function POST(request: Request):Promise<NextResponse>  {
  const body = await request.json();

  const parsedCredentials = signupSchema.safeParse(body);

  if (!parsedCredentials.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsedCredentials.error.flatten(),
      },
      { status: 400 },
    );
  }

  const {name, email, password, role} = parsedCredentials.data;

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ user }, { status: 201 });
}

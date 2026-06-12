import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "../../prisma/generated/prisma/client.js";
import { prisma } from "../db.js";
import { authSchema } from "../types/authSchema.types.js";
import { createToken } from "../utils/auth.js";

export async function signup(req: Request, res: Response): Promise<void> {
  const result = authSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Invalid Input",
      details: result.error.flatten(),
    });
    return;
  }

  const { username, password } = result.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      token: createToken(user.id),
      userId: user.id,
      username: user.username,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ error: "Username already exists" });
      return;
    }

    console.error("Signup failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function signin(req: Request, res: Response): Promise<void> {
  const result = authSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: "Invalid Input",
      details: result.error.flatten(),
    });
    return;
  }

  const { username, password } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.status(200).json({
      token: createToken(user.id),
      userId: user.id,
      username: user.username,
    });
  } catch (error) {
    console.error("Signin failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

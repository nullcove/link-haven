import { Router, type IRouter } from "express";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "link_haven_salt").digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

async function createSession(userId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(sessionsTable).values({ userId, token, expiresAt });
  return token;
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, name } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ email, name, passwordHash: hashPassword(password), isGuest: false })
    .returning();

  const token = await createSession(user.id);

  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, isGuest: user.isGuest, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.isGuest) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = await createSession(user.id);

  res.json({
    user: { id: user.id, email: user.email, name: user.name, isGuest: user.isGuest, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const token = auth.slice(7);
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));

  if (!session || session.expiresAt < new Date()) {
    res.status(401).json({ error: "Session expired" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({ id: user.id, email: user.email, name: user.name, isGuest: user.isGuest, createdAt: user.createdAt });
});

router.post("/auth/guest", async (req, res): Promise<void> => {
  // Try to find the demo user first — guest sessions always log in as demo
  // so visitors immediately see a fully-populated bookmark library.
  const DEMO_EMAIL = "demo@linkhaven.app";
  const [demoUser] = await db.select().from(usersTable).where(eq(usersTable.email, DEMO_EMAIL));

  if (demoUser) {
    const token = await createSession(demoUser.id);
    res.json({
      user: { id: demoUser.id, email: demoUser.email, name: demoUser.name, isGuest: true, createdAt: demoUser.createdAt },
      token,
    });
    return;
  }

  // Fallback: create a fresh guest account if demo user doesn't exist
  const guestEmail = `guest_${Date.now()}@linkhaven.local`;
  const [user] = await db
    .insert(usersTable)
    .values({ email: guestEmail, name: "Guest User", isGuest: true })
    .returning();

  const token = await createSession(user.id);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, isGuest: user.isGuest, createdAt: user.createdAt },
    token,
  });
});

export default router;

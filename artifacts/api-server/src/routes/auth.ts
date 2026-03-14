import { Router } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();
const SALT_ROUNDS = 12;

function safeUser(u: typeof schema.users.$inferSelect) {
  const { passwordHash: _, ...safe } = u;
  return safe;
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db
      .insert(schema.users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone?.trim() || null,
        role: "user",
      })
      .returning();
    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    res.status(201).json({ user: safeUser(user), token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    res.json({ user: safeUser(user), token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.jwtPayload!;
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: safeUser(user) });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.jwtPayload!;
    const { name, phone } = req.body;
    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: "Name must be at least 2 characters" });
      return;
    }
    const [updated] = await db
      .update(schema.users)
      .set({ name: name.trim(), phone: phone?.trim() || null })
      .where(eq(schema.users.id, userId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: safeUser(updated) });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.patch("/password", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.jwtPayload!;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current and new password are required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.id, userId));
    res.json({ success: true });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

router.post("/logout", requireAuth, (_req, res) => {
  res.json({ success: true });
});

router.post("/google", async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      res.status(400).json({ error: "Access token is required" });
      return;
    }
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    if (!googleRes.ok) {
      res.status(401).json({ error: "Invalid Google token" });
      return;
    }
    const googleUser = await googleRes.json() as { sub: string; email: string; name: string; picture?: string };
    if (!googleUser.email) {
      res.status(400).json({ error: "No email from Google" });
      return;
    }
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, googleUser.email.toLowerCase())).limit(1);
    let user: typeof schema.users.$inferSelect;
    if (existing.length > 0) {
      [user] = await db.update(schema.users).set({ googleId: googleUser.sub }).where(eq(schema.users.id, existing[0].id)).returning();
    } else {
      const dummyHash = await import("bcrypt").then(b => b.default.hash(Math.random().toString(36), 10));
      [user] = await db.insert(schema.users).values({
        name: googleUser.name || googleUser.email.split("@")[0],
        email: googleUser.email.toLowerCase(),
        passwordHash: dummyHash,
        googleId: googleUser.sub,
        role: "user",
      }).returning();
    }
    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    res.json({ user: safeUser(user), token });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Google login failed" });
  }
});

export default router;

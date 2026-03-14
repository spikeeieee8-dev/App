import { Router } from "express";
import { store } from "../lib/store.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/register", (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }
  if (store.users.findByEmail(email)) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const user = store.users.create({
    name, email, phone,
    passwordHash: store.hashPassword(password),
    role: "user",
  });
  const session = store.sessions.create(user.id);
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser, token: session.token });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const user = store.users.findByEmail(email);
  if (!user || user.passwordHash !== store.hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const session = store.sessions.create(user.id);
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser, token: session.token });
});

router.get("/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

router.patch("/profile", requireAuth, (req, res) => {
  const user = (req as any).user;
  const { name, phone } = req.body;
  if (!name || name.trim().length < 2) {
    res.status(400).json({ error: "Name must be at least 2 characters" });
    return;
  }
  const updated = store.users.update(user.id, {
    name: name.trim(),
    phone: phone?.trim() || undefined,
  });
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = updated;
  res.json({ user: safeUser });
});

router.patch("/password", requireAuth, (req, res) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required" });
    return;
  }
  if (user.passwordHash !== store.hashPassword(currentPassword)) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }
  const updated = store.users.update(user.id, {
    passwordHash: store.hashPassword(newPassword),
  });
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ success: true });
});

router.post("/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) store.sessions.delete(token);
  res.json({ success: true });
});

export default router;

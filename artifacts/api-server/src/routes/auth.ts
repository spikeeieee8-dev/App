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

router.post("/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) store.sessions.delete(token);
  res.json({ success: true });
});

export default router;

import { Request, Response, NextFunction } from "express";
import { store } from "../lib/store.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const session = store.sessions.find(token);
  if (!session || new Date(session.expiresAt) < new Date()) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  const user = store.users.findById(session.userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const user = (req as any).user;
    if (user?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_URL_FILE = join(__dirname, "../../db.url");

const router = Router();

const PUBLIC_KEYS = ["easypaisa_number", "easypaisa_name", "easypaisa_qr_url"];

const DEFAULTS: Record<string, string> = {
  easypaisa_number: "0300-1234567",
  easypaisa_name: "Almera Official",
  easypaisa_qr_url: "",
};

async function ensureDefaults() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onConflictDoNothing();
  }
}

router.get("/public", async (_req, res) => {
  try {
    await ensureDefaults();
    const rows = await db
      .select()
      .from(schema.settings)
      .where(
        // Only return public keys
        eq(schema.settings.key, "easypaisa_number")
      );

    const allRows = await db
      .select()
      .from(schema.settings);

    const result: Record<string, string> = {};
    for (const row of allRows) {
      if (PUBLIC_KEYS.includes(row.key)) {
        result[row.key] = row.value;
      }
    }
    res.json({ settings: result });
  } catch (err) {
    console.error("Get public settings error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.get("/", requireAdmin, async (_req, res) => {
  try {
    await ensureDefaults();
    const rows = await db.select().from(schema.settings);
    const result: Record<string, string> = {};
    for (const row of rows) result[row.key] = row.value;
    res.json({ settings: result });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/:key", requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined || value === null) {
      res.status(400).json({ error: "Value is required" });
      return;
    }
    const [setting] = await db
      .insert(schema.settings)
      .values({ key, value: String(value) })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value: String(value), updatedAt: new Date() },
      })
      .returning();
    res.json({ setting });
  } catch (err) {
    console.error("Update setting error:", err);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

router.get("/database-url", requireAdmin, (_req, res) => {
  try {
    const hasCustomUrl = existsSync(DB_URL_FILE);
    let maskedUrl = "";
    if (hasCustomUrl) {
      const raw = readFileSync(DB_URL_FILE, "utf-8").trim();
      maskedUrl = raw.replace(/\/\/([^:]+):([^@]+)@/, "://$1:****@");
    }
    res.json({ hasCustomUrl, maskedUrl });
  } catch {
    res.json({ hasCustomUrl: false, maskedUrl: "" });
  }
});

router.put("/database-url", requireAdmin, (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string" || !url.trim().startsWith("postgres")) {
      res.status(400).json({ error: "A valid PostgreSQL connection URL is required" });
      return;
    }
    writeFileSync(DB_URL_FILE, url.trim(), "utf-8");
    res.json({ success: true, message: "Database URL saved. Restarting server..." });
    setTimeout(() => process.exit(0), 500);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save database URL" });
  }
});

router.delete("/database-url", requireAdmin, (_req, res) => {
  try {
    if (existsSync(DB_URL_FILE)) unlinkSync(DB_URL_FILE);
    res.json({ success: true, message: "Reverted to default database. Restarting..." });
    setTimeout(() => process.exit(0), 500);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to remove database URL" });
  }
});

export default router;

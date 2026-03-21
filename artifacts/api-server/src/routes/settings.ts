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

const PUBLIC_KEYS = [
  "easypaisa_number", "easypaisa_name", "easypaisa_qr_url",
  "whatsapp_number", "instagram_url", "twitter_url", "tiktok_url",
  "terms_content", "privacy_content", "refund_content",
  "store_name", "store_tagline", "about_content",
];

const DEFAULTS: Record<string, string> = {
  easypaisa_number: "0300-1234567",
  easypaisa_name: "Almera Official",
  easypaisa_qr_url: "",
  whatsapp_number: "923001234567",
  instagram_url: "",
  twitter_url: "",
  tiktok_url: "",
  store_name: "Almera",
  store_tagline: "Premium Fashion for Pakistan",
  terms_content: `# Terms of Service\n\nLast updated: ${new Date().toLocaleDateString()}\n\nBy using the Almera app, you agree to these terms.\n\n## Orders\nAll orders are subject to availability. We reserve the right to cancel any order.\n\n## Payments\nWe accept Cash on Delivery (COD) and Easypaisa. Payment must be completed before dispatch for digital payments.\n\n## Returns\nItems can be returned within 7 days if unused and in original packaging. Contact us via WhatsApp for return requests.\n\n## Contact\nFor any queries, reach us on WhatsApp or at support@almera.pk`,
  privacy_content: `# Privacy Policy\n\nLast updated: ${new Date().toLocaleDateString()}\n\nAlmera respects your privacy. This policy explains how we collect and use your information.\n\n## What We Collect\n- Name, phone, and address for order delivery\n- Email for account and order notifications\n- Order history\n\n## How We Use It\n- Processing and delivering your orders\n- Sending order status updates\n- Improving our service\n\n## We Never\n- Sell your data to third parties\n- Share your information without your consent\n\n## Contact\nsupport@almera.pk`,
  refund_content: `# Refund & Return Policy\n\nLast updated: ${new Date().toLocaleDateString()}\n\n## Eligibility\nItems are eligible for return within 7 days of delivery if:\n- The item is unused and unworn\n- Original tags are intact\n- Item is in original packaging\n\n## Non-Returnable Items\n- Sale or discounted items\n- Items without original packaging\n\n## Process\n1. Contact us on WhatsApp with your order ID\n2. Share photos of the item\n3. We will arrange a pickup or ask you to ship it back\n\n## Refunds\nRefunds are processed within 5-7 business days after we receive the item.\n\n## Contact\nWhatsApp: +92 300 1234567`,
  about_content: `# About Almera\n\nWelcome to **Almera** — a premium fashion brand crafted for Pakistan.\n\nWe believe every person deserves to feel confident, elegant, and comfortable in what they wear. That's why we source only the finest fabrics and work with skilled artisans to bring you clothing that is as beautiful as it is durable.\n\n## Our Story\n\nAlmera was founded with a simple mission: make high-quality fashion accessible to everyone in Pakistan. From casual everyday wear to special occasion outfits, we have something for every moment.\n\n## Our Values\n\n- **Quality First** — Every piece is carefully selected and quality-checked before it reaches you.\n- **Customer Love** — Your satisfaction is our top priority. We're always here to help.\n- **Authenticity** — What you see is what you get. No filters, no misleading photos.\n- **Sustainability** — We care about the environment and work to reduce our footprint.\n\n## Contact Us\n\nFor support or queries, reach us at:\n**support@almera.pk**\n\nWe typically respond within 24 hours.`,
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

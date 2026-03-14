import { Worker } from "bullmq";
import nodemailer from "nodemailer";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.log("[Workers] REDIS_URL not set — background workers disabled.");
  process.exit(0);
}

const url = new URL(REDIS_URL);
const connection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  password: url.password || undefined,
  tls: url.protocol === "rediss:" ? ({} as object) : undefined,
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const orderWorker = new Worker(
  "orders",
  async (job) => {
    if (job.name === "order-confirmation") {
      const { orderId, userEmail } = job.data as { orderId: string; userEmail: string };
      console.log(`[Worker] Sending order confirmation for ${orderId} to ${userEmail}`);

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({
          from: `"Almera" <${process.env.SMTP_USER}>`,
          to: userEmail,
          subject: "Order Confirmation — Almera",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h1 style="color:#b8860b">Order Confirmed</h1>
              <p>Thank you for your order at <strong>Almera</strong>.</p>
              <p>Your Order ID: <strong>${orderId}</strong></p>
              <p>We will notify you once your order is dispatched.</p>
              <hr/>
              <p style="color:#888;font-size:12px">Almera — Premium Pakistani Fashion</p>
            </div>
          `,
        });
        console.log(`[Worker] Order confirmation sent to ${userEmail}`);
      } else {
        console.log(`[Worker] SMTP not configured — skipping email for ${orderId}`);
      }
    }
  },
  { connection }
);

const analyticsWorker = new Worker(
  "analytics",
  async (job) => {
    if (job.name === "analytics-update") {
      const { eventType, meta } = job.data as { eventType: string; meta: object };
      console.log(`[Worker] Analytics event: ${eventType}`, meta);
    }
  },
  { connection }
);

const cartWorker = new Worker(
  "cart",
  async (job) => {
    if (job.name === "cart-cleanup") {
      console.log("[Worker] Running cart cleanup...");
    }
    if (job.name === "abandoned-cart") {
      const { userEmail, cartItems } = job.data as { userEmail: string; cartItems: unknown[] };
      console.log(`[Worker] Abandoned cart reminder for ${userEmail} (${cartItems.length} items)`);
    }
  },
  { connection }
);

orderWorker.on("completed", (job) => console.log(`[Orders Worker] Job ${job.id} completed`));
orderWorker.on("failed", (job, err) => console.error(`[Orders Worker] Job ${job?.id} failed:`, err));
analyticsWorker.on("failed", (job, err) => console.error(`[Analytics Worker] Job ${job?.id} failed:`, err));
cartWorker.on("failed", (job, err) => console.error(`[Cart Worker] Job ${job?.id} failed:`, err));

console.log("[Workers] All workers started successfully");

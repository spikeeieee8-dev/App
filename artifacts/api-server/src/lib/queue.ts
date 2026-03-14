import { Queue } from "bullmq";

export type JobName =
  | "order-confirmation"
  | "analytics-update"
  | "cart-cleanup"
  | "abandoned-cart";

let orderQueue: Queue | null = null;
let analyticsQueue: Queue | null = null;
let cartQueue: Queue | null = null;

const REDIS_URL = process.env.REDIS_URL;

function getConnection() {
  if (!REDIS_URL) return null;
  const url = new URL(REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
  };
}

export function getOrderQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!orderQueue) {
    orderQueue = new Queue("orders", { connection: getConnection()! });
  }
  return orderQueue;
}

export function getAnalyticsQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!analyticsQueue) {
    analyticsQueue = new Queue("analytics", { connection: getConnection()! });
  }
  return analyticsQueue;
}

export function getCartQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!cartQueue) {
    cartQueue = new Queue("cart", { connection: getConnection()! });
  }
  return cartQueue;
}

export async function enqueueOrderConfirmation(orderId: string, userEmail: string) {
  const q = getOrderQueue();
  if (!q) return;
  await q.add("order-confirmation", { orderId, userEmail }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}

export async function enqueueAnalyticsUpdate(eventType: string, meta: object) {
  const q = getAnalyticsQueue();
  if (!q) return;
  await q.add("analytics-update", { eventType, meta }, { attempts: 2 });
}

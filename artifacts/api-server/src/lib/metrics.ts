import {
  Counter,
  Histogram,
  collectDefaultMetrics,
  register,
} from "prom-client";

collectDefaultMetrics({ prefix: "almera_" });

export const httpRequests = new Counter({
  name: "almera_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const httpDuration = new Histogram({
  name: "almera_http_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const errorCounter = new Counter({
  name: "almera_errors_total",
  help: "Total API errors",
  labelNames: ["route", "status_code"],
});

export const orderCounter = new Counter({
  name: "almera_orders_created_total",
  help: "Total orders created",
  labelNames: ["payment_method"],
});

export const revenueCounter = new Counter({
  name: "almera_revenue_pkr_total",
  help: "Total revenue in PKR",
});

export { register };

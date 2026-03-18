import http from "http";
import app from "./app.js";
import { metricsRouter } from "./routes/index.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.use("/metrics", metricsRouter);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "production"}`);
});

const PROXY_PORT = 8080;
if (port !== PROXY_PORT) {
  const proxyServer = http.createServer(app);
  proxyServer.listen(PROXY_PORT, () => {
    console.log(`Server also listening on port ${PROXY_PORT} (proxy bridge)`);
  });
}

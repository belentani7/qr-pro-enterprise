import "dotenv/config";
import express from "express";
import fs from "fs";
import { createServer, type Server } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import {
  MAX_PROMPT_CHARS,
  calculateContrastRatio,
  generateMultiPartQRSVG,
} from "../../lib/qr-engine";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.listen(port, "0.0.0.0", () => {
      tester.close(() => resolve(true));
    });
    tester.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("X-Content-Type-Options", "nosniff");
    res.header("Referrer-Policy", "strict-origin-when-cross-origin");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "qr-pro-enterprise",
      maxPromptChars: MAX_PROMPT_CHARS,
      timestamp: Date.now(),
    });
  });

  app.post("/api/qr/generate", (req, res) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const content = typeof body.content === "string" ? body.content : "";
      if (!content.trim() || content.length > MAX_PROMPT_CHARS) {
        res.status(400).json({
          error: `El campo 'content' es obligatorio y admite hasta ${MAX_PROMPT_CHARS} caracteres.`,
        });
        return;
      }

      const darkColor = typeof body.darkColor === "string" ? body.darkColor : "#000000";
      const lightColor = typeof body.lightColor === "string" ? body.lightColor : "#FFFFFF";
      const width = typeof body.width === "number" ? body.width : 320;
      const moduleShape =
        body.moduleShape === "rounded" ||
        body.moduleShape === "circle" ||
        body.moduleShape === "diamond" ||
        body.moduleShape === "organic"
          ? body.moduleShape
          : "square";
      const logoText = typeof body.logoText === "string" ? body.logoText.slice(0, 4) : undefined;

      const result = generateMultiPartQRSVG(content, {
        width,
        darkColor,
        lightColor,
        moduleShape,
        logoText,
      });
      const contrast = calculateContrastRatio(darkColor, lightColor);

      res.json({
        ok: true,
        isMultiPart: result.isMultiPart,
        totalChars: result.totalChars,
        totalBytes: result.totalBytes,
        parts: result.parts,
        svg: result.parts[0].svg,
        dataUrl: result.parts[0].dataUrl,
        contrast,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error interno al generar QR";
      res.status(400).json({ error: message });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  const rootDir = process.cwd();
  const distPublicDir = path.join(rootDir, "dist", "public");
  if (fs.existsSync(distPublicDir)) {
    app.use(express.static(distPublicDir, { extensions: ["html"] }));
  }
  const distAssetsDir = path.join(rootDir, "dist", "assets");
  if (fs.existsSync(distAssetsDir)) {
    app.use("/assets", express.static(distAssetsDir));
  }
  app.use("/assets", express.static(path.join(rootDir, "assets")));
  app.use("/brand", express.static(path.join(rootDir, "brand")));
  app.get("/hero.js", (_req, res) => {
    res.sendFile(path.join(rootDir, "hero.js"));
  });
  app.get("/", (_req, res) => {
    const builtIndex = path.join(distPublicDir, "index.html");
    res.sendFile(fs.existsSync(builtIndex) ? builtIndex : path.join(rootDir, "index.html"));
  });

  return app;
}

export async function startServer(customPort?: number): Promise<{ server: Server; port: number }> {
  const app = createApp();
  const server = createServer(app);
  const preferredPort = customPort ?? parseInt(process.env.PORT || "3000", 10);
  const port = customPort !== undefined ? customPort : await findAvailablePort(preferredPort);

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "0.0.0.0", () => {
      const address = server.address();
      const resolvedPort = typeof address === "object" && address ? address.port : port;
      console.log(`[api] server listening on http://0.0.0.0:${resolvedPort}`);
      resolve({ server, port: resolvedPort });
    });
  });
}

if (process.env.VITEST !== "true") {
  startServer().catch(console.error);
}

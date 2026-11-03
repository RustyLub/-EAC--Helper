import express from "express";
import path from "path";
import { randomBytes } from "crypto";
import { createServer as createViteServer } from "vite";
import { startBot } from "./src/bot/index";
import { getRuntimeGuild } from "./src/bot/utils/runtime";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    const missing = ["DISCORD_TOKEN", "CLIENT_ID", "CLIENT_SECRET", "APP_URL"].filter((key) => !process.env[key]?.trim());
    if (missing.length) throw new Error("Missing required production environment variables: " + missing.join(", "));
    if (process.env.DISCORD_TOKEN === "YOUR_DISCORD_BOT_TOKEN" || process.env.CLIENT_SECRET === "YOUR_DISCORD_OAUTH_CLIENT_SECRET" || !/^\d{17,20}$/.test(process.env.CLIENT_ID!)) {
      throw new Error("DISCORD_TOKEN or CLIENT_ID is invalid. Check the Render environment settings.");
    }
    if (new URL(process.env.APP_URL!).protocol !== "https:") throw new Error("APP_URL must use HTTPS in production.");
  }
  const frontendOrigin = new URL(process.env.APP_URL || `http://localhost:${PORT}`).origin;
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
  };

  // The frontend and API are served from the same origin; CORS is only enabled for an explicitly configured frontend origin.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin === frontendOrigin || (!isProduction && origin === "http://localhost:5173")) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.set("trust proxy", 1);
  app.use(cookieParser());
  app.use(express.json());

  // Keep both health URLs available for Render and external uptime checks.
  app.get(["/api/health", "/health"], (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ status: "ok" });
  });

  const getAppOrigin = () => {
    const configured = process.env.APP_URL;
    if (!configured) throw new Error("APP_URL is not configured");
    return new URL(configured).origin;
  };

  const getRedirectUri = () => new URL("/auth/callback", getAppOrigin()).toString();

  // Verify the signed-in Discord user can manage the requested guild.
  const userCanManageGuild = async (token: string, guildId: string) => {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) return null;
    if (!response.ok) return false;

    const guilds = await response.json() as Array<{ id: string; permissions: string }>;
    const guild = guilds.find((item) => item.id === guildId);
    if (!guild) return false;

    const permissions = BigInt(guild.permissions);
    return (permissions & 0x8n) === 0x8n || (permissions & 0x20n) === 0x20n;
  };

  // Discord OAuth2: use a server-configured redirect URI and one-time state.
  app.get("/api/auth/url", (_req, res) => {
    const clientId = process.env.CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: "Missing CLIENT_ID" });

    let redirectUri: string;
    try {
      redirectUri = getRedirectUri();
    } catch {
      return res.status(500).json({ error: "APP_URL is not configured correctly" });
    }

    const state = randomBytes(32).toString("hex");
    res.cookie("discord_oauth_state", state, {
      ...cookieOptions,
      maxAge: 10 * 60 * 1000,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "identify guilds",
      state,
    });
    res.json({ url: `https://discord.com/oauth2/authorize?${params.toString()}` });
  });

  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, state } = req.query;
    const expectedState = req.cookies.discord_oauth_state;
    res.clearCookie("discord_oauth_state", cookieOptions);

    if (!code || typeof code !== "string") {
      return res.status(400).send("Discord did not return an authorization code.");
    }
    if (!state || typeof state !== "string" || !expectedState || state !== expectedState) {
      return res.status(403).send("OAuth state validation failed. Please close this window and try again.");
    }

    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).send("Discord OAuth credentials are not configured.");
    }

    try {
      const redirectUri = getRedirectUri();
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      const tokenData = await tokenResponse.json() as {
        access_token?: string;
        expires_in?: number;
        error?: string;
        error_description?: string;
      };

      if (!tokenResponse.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || tokenData.error || "Discord token exchange failed");
      }

      res.cookie("discord_token", tokenData.access_token, {
        ...cookieOptions,
        maxAge: Math.max(1, tokenData.expires_in || 3600) * 1000,
      });

      const appOrigin = frontendOrigin;
      res.type("html").send(`<!doctype html>
        <html><head><meta charset="utf-8"><title>Discord login</title></head>
        <body><p>Авторизация успешна. Это окно можно закрыть.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS" }, ${JSON.stringify(appOrigin)});
              window.close();
            } else {
              window.location.replace("/");
            }
          </script>
        </body></html>`);
    } catch (error) {
      console.error("Discord OAuth error:", error);
      res.status(502).send("Не удалось завершить авторизацию Discord. Попробуйте ещё раз.");
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("discord_token", cookieOptions);
    res.json({ success: true });
  });

  app.get("/api/user", async (req, res) => {
    const token = req.cookies.discord_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    try {
      const response = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) res.clearCookie("discord_token", cookieOptions);
        return res.status(response.status).json({ error: "Failed to fetch user" });
      }
      res.json(await response.json());
    } catch {
      res.status(502).json({ error: "Discord API unavailable" });
    }
  });

  app.get("/api/guilds", async (req, res) => {
    const token = req.cookies.discord_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    try {
      const response = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) res.clearCookie("discord_token", cookieOptions);
        return res.status(response.status).json({ error: "Failed to fetch guilds" });
      }

      const guilds = await response.json() as Array<{ permissions: string }>;
      const manageableGuilds = guilds.filter((guild) => {
        const permissions = BigInt(guild.permissions);
        return (permissions & 0x8n) === 0x8n || (permissions & 0x20n) === 0x20n;
      });
      res.json(manageableGuilds);
    } catch {
      res.status(502).json({ error: "Discord API unavailable" });
    }
  });

  const guildResourceHandler = (resource: "channels" | "roles") => async (req: express.Request, res: express.Response) => {
    const userToken = req.cookies.discord_token;
    if (!userToken) return res.status(401).json({ error: "Not authenticated" });

    const guildId = req.params.guildId;
    try {
      const allowed = await userCanManageGuild(userToken, guildId);
      if (allowed === null) {
        res.clearCookie("discord_token", cookieOptions);
        return res.status(401).json({ error: "Discord session expired" });
      }
      if (!allowed) return res.status(403).json({ error: "You do not have permission to manage this server" });

      const botToken = process.env.DISCORD_TOKEN;
      if (!botToken) return res.status(500).json({ error: "Bot token not configured" });

      const response = await fetch(`https://discord.com/api/guilds/${encodeURIComponent(guildId)}/${resource}`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (!response.ok) return res.status(response.status).json({ error: `Failed to fetch ${resource}` });
      res.json(await response.json());
    } catch {
      res.status(502).json({ error: "Discord API unavailable" });
    }
  };

  app.get("/api/guilds/:guildId/channels", guildResourceHandler("channels"));
  app.get("/api/guilds/:guildId/roles", guildResourceHandler("roles"));

  const supportedModules = new Set([
    "moderation", "automod", "welcome", "levels", "custom-commands", "announcements",
  ]);

  const authorizeGuildSettings = async (req: express.Request, res: express.Response) => {
    const token = req.cookies.discord_token;
    if (!token) {
      res.status(401).json({ error: "Not authenticated" });
      return false;
    }
    try {
      const allowed = await userCanManageGuild(token, req.params.guildId);
      if (allowed === null) {
        res.clearCookie("discord_token", cookieOptions);
        res.status(401).json({ error: "Discord session expired" });
        return false;
      }
      if (!allowed) {
        res.status(403).json({ error: "You do not have permission to manage this server" });
        return false;
      }
      return true;
    } catch {
      res.status(502).json({ error: "Discord API unavailable" });
      return false;
    }
  };

  // Web-panel settings share the bot runtime state and remain memory-only.
  app.get("/api/guilds/:guildId/settings", async (req, res) => {
    if (!(await authorizeGuildSettings(req, res))) return;
    const stored = getRuntimeGuild(req.params.guildId).modules;
    const modules = Object.fromEntries([...supportedModules].map((id) => [id, stored[id] !== false]));
    res.json({ guildId: req.params.guildId, modules });
  });

  app.put("/api/guilds/:guildId/settings", async (req, res) => {
    if (!(await authorizeGuildSettings(req, res))) return;
    const requested = req.body?.modules;
    if (!requested || typeof requested !== "object" || Array.isArray(requested)) {
      return res.status(400).json({ error: "Expected a modules object" });
    }
    const entries = Object.entries(requested);
    const invalid = entries.find(([id, enabled]) => !supportedModules.has(id) || typeof enabled !== "boolean");
    if (invalid) return res.status(400).json({ error: `Invalid module setting: ${invalid[0]}` });
    const current = getRuntimeGuild(req.params.guildId).modules;
    for (const [id, enabled] of entries) current[id] = enabled as boolean;
    const modules = Object.fromEntries([...supportedModules].map((id) => [id, current[id] !== false]));
    res.json({ guildId: req.params.guildId, modules });
  });

  startBot().catch((error) => {
    console.error("Discord bot failed to start:", error);
    if (isProduction) process.exit(1);
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (production: ${isProduction})`);
  });
}

startServer().catch((error) => {
  console.error("Fatal server startup error:", error);
  process.exit(1);
});

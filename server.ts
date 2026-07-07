import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { startBot } from "./src/bot/index";
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cookieParser());
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Discord OAuth Routes
  app.get("/api/auth/url", (req, res) => {
    const origin = req.query.origin || process.env.APP_URL;
    const redirectUri = `${origin}/auth/callback`;
    const clientId = process.env.CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ error: "Missing CLIENT_ID" });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "identify guilds",
    });

    res.json({ url: `https://discord.com/oauth2/authorize?${params.toString()}` });
  });

  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).send("No code provided");
    }

    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    
    // We use the host and protocol to reconstruct the redirect URI if not using APP_URL
    const origin = process.env.APP_URL || `http://${req.headers.host}`;
    const redirectUri = `${origin}/auth/callback`;

    try {
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Store the token in a cookie
      res.cookie("discord_token", tokenData.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: tokenData.expires_in * 1000,
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("OAuth error:", error);
      res.status(500).send(`Authentication failed: ${error.message}`);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("discord_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });

  // API to get user info and guilds
  app.get("/api/user", async (req, res) => {
    const token = req.cookies.discord_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          res.clearCookie("discord_token");
        }
        return res.status(userResponse.status).json({ error: "Failed to fetch user" });
      }

      const userData = await userResponse.json();
      res.json(userData);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/guilds", async (req, res) => {
    const token = req.cookies.discord_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const guildsResponse = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!guildsResponse.ok) {
        return res.status(guildsResponse.status).json({ error: "Failed to fetch guilds" });
      }

      const guildsData = await guildsResponse.json();
      
      // Filter for guilds where user has MANAGE_GUILD or ADMINISTRATOR
      // Permission bitwise: ADMINISTRATOR is 0x8, MANAGE_GUILD is 0x20
      const adminGuilds = guildsData.filter((guild: any) => {
        const permissions = BigInt(guild.permissions);
        return (permissions & 8n) === 8n || (permissions & 32n) === 32n;
      });

      res.json(adminGuilds);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/guilds/:guildId/channels", async (req, res) => {
    const token = req.cookies.discord_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const botToken = process.env.DISCORD_TOKEN;
    if (!botToken) return res.status(500).json({ error: "Bot token not configured" });

    try {
      const response = await fetch(`https://discord.com/api/guilds/${req.params.guildId}/channels`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch channels" });
      }

      const channels = await response.json();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/guilds/:guildId/roles", async (req, res) => {
    const token = req.cookies.discord_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const botToken = process.env.DISCORD_TOKEN;
    if (!botToken) return res.status(500).json({ error: "Bot token not configured" });

    try {
      const response = await fetch(`https://discord.com/api/guilds/${req.params.guildId}/roles`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch roles" });
      }

      const roles = await response.json();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Start Discord Bot
  startBot().catch(console.error);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

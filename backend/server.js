    import "dotenv/config";
    import express from "express";
    import session from "express-session";
    import passport from "passport";
    import { Strategy as SteamStrategy } from "passport-steam";
    import fetch from "node-fetch";

    const {
    STEAM_API_KEY,
    APP_BASE_URL = "http://localhost:3000",
    SESSION_SECRET = "change_me"
    } = process.env;

    const PORT = Number(process.env.PORT || 3000);

    /* ---------- Passport (Steam OpenID) ---------- */
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    passport.use(
    new SteamStrategy(
        {
        returnURL: `${APP_BASE_URL}/auth/steam/return`,
        realm: APP_BASE_URL,
        apiKey: STEAM_API_KEY
        },
        (identifier, profile, done) => done(null, profile) // profile.id = SteamID64
    )
    );

    /* ---------- App ---------- */
    const app = express();

    app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: APP_BASE_URL.startsWith("https")
        }
    })
    );
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.json());

    /* ---------- Helpers Steam Web API ---------- */
    async function steamAPI(path, params = {}) {
    const url = new URL(`https://api.steampowered.com/${path}`);
    url.searchParams.set("key", STEAM_API_KEY);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Steam API ${path} -> ${r.status}`);
    return r.json();
    }

    async function getPlayerSummaries(steamid) {
    const j = await steamAPI("ISteamUser/GetPlayerSummaries/v2/", { steamids: steamid });
    return j?.response?.players?.[0] || null;
    }

    async function getL4DHours(steamid) {
    const j = await steamAPI("IPlayerService/GetOwnedGames/v1/", {
        steamid,
        include_appinfo: 1,
        include_played_free_games: 1
    });
    const games = j?.response?.games || [];
    const toHours = (mins) => Math.round((mins || 0) / 60);
    const g550 = games.find((g) => g.appid === 550); // Left 4 Dead 2
    const g500 = games.find((g) => g.appid === 500); // Left 4 Dead
    return { l4d2_hours: toHours(g550?.playtime_forever), l4d1_hours: toHours(g500?.playtime_forever) };
    }

    /* ---------- Auth routes ---------- */
    app.get("/auth/steam", passport.authenticate("steam", { failureRedirect: "/login-failed" }));
    app.get(
    "/auth/steam/return",
    passport.authenticate("steam", { failureRedirect: "/login-failed" }),
    (req, res) => res.redirect("/") // vuelve a tu página
    );

    /* ---------- API para el frontend ---------- */
    app.get("/api/me", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    try {
        const steamid = req.user.id;
        const summary = await getPlayerSummaries(steamid);
        const hours = await getL4DHours(steamid);

        res.json({
        steamid,
        name: summary?.personaname,
        avatar: summary?.avatarfull,
        profileurl: summary?.profileurl,
        country: summary?.loccountrycode || null,
        hours_l4d2: hours.l4d2_hours,
        hours_l4d1: hours.l4d1_hours,
        eligible_100h: (hours.l4d2_hours || 0) >= 100,
        is_premium: false // luego vendrá de tu DB
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Steam API error" });
    }
    });

    app.post("/api/logout", (req, res) => {
    req.logout(() => res.json({ ok: true }));
    });

    /* ---------- Servir tu frontend ---------- */
    import path from "path";
    import { fileURLToPath } from "url";
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.use(express.static(path.join(__dirname, "public"))); // carpeta /backend/public

    app.listen(PORT, () => {
    console.log(`Backend listo: ${APP_BASE_URL}`);
    });

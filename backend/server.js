    // --- Debug corto para confirmar que el .env cargó:
    console.log("STEAM_API_KEY cargada? ", (process.env.STEAM_API_KEY || "").slice(0, 6) + "...");

    // --- ESM total (no uses require) ---
    import "dotenv/config";
    import express from "express";
    import session from "express-session";
    import passport from "passport";
    import { Strategy as SteamStrategy } from "passport-steam";
    import fetch from "node-fetch";
    import path from "path";
    import { fileURLToPath } from "url";

    // --------- ENV ----------
    const {
    STEAM_API_KEY,
    APP_BASE_URL = "http://localhost:3000",
    SESSION_SECRET = "change_me",
    PORT: PORT_ENV
    } = process.env;

    const PORT = Number(PORT_ENV || 3000);

    // --------- PASSPORT (Steam OpenID) ----------
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    // IMPORTANTE: un solo import de SteamStrategy (ya está arriba)
    // y usamos profile:false para que el callback NO use la Web API aquí.
    passport.use(
    new SteamStrategy(
        {
        returnURL: APP_BASE_URL + "/auth/steam/return",
        realm: APP_BASE_URL,
        profile: false, // evitamos pedir el perfil en el callback
        },
        (identifier, _profile, done) => {
        // identifier = 'https://steamcommunity.com/openid/id/7656119...'
        const match = identifier.match(/\d+$/);
        const steamid = match ? match[0] : null;
        if (!steamid) return done(new Error("No SteamID in identifier"));
        // guardamos solo el ID; el perfil real lo pedimos luego en /api/me
        return done(null, { id: steamid });
        }
    )
    );

    // --------- APP ----------
    const app = express();

    app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: APP_BASE_URL.startsWith("https"),
        },
    })
    );
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.json());

    // --------- Helpers Steam Web API ----------
    async function steamAPI(pathPart, params = {}) {
    const url = new URL(`https://api.steampowered.com/${pathPart}`);
    url.searchParams.set("key", STEAM_API_KEY);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Steam API ${pathPart} -> ${r.status}`);
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
        include_played_free_games: 1,
    });
    const games = j?.response?.games || [];
    const toHours = (mins) => Math.round((mins || 0) / 60);
    const g550 = games.find((g) => g.appid === 550); // L4D2
    const g500 = games.find((g) => g.appid === 500); // L4D1
    return {
        l4d2_hours: toHours(g550?.playtime_forever),
        l4d1_hours: toHours(g500?.playtime_forever),
    };
    }

    // --------- Rutas de Auth ----------
    app.get("/auth/steam", passport.authenticate("steam", { failureRedirect: "/login-failed" }));

    app.get(
    "/auth/steam/return",
    passport.authenticate("steam", { failureRedirect: "/login-failed" }),
    (req, res) => res.redirect("/")
    );

    // --------- API para el frontend ----------
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
        is_premium: false, // luego lo sacarás de tu DB
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Steam API error" });
    }
    });

    app.post("/api/logout", (req, res) => {
    req.logout(() => res.json({ ok: true }));
    });

    // --------- Static (sirve tu frontend desde /public) ----------
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.use(express.static(path.join(__dirname, "public")));

    // Rutas de utilidad
    app.get("/health", (_req, res) => res.json({ ok: true }));

    app.listen(PORT, () => {
    console.log(`Backend listo: ${APP_BASE_URL}`);
    });

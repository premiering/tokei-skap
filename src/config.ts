function parseBool(s: string | undefined, fallback: boolean): boolean {
    if (s == "" || s == null || s == undefined)
        return fallback;
    return s.toLowerCase() === "true";
}

function parseNumber(s: string | undefined, fallback: number): number {
    if (s == "" || s == null || s == undefined)
        return fallback;
    return Number(s);
}

export let config: TokeiConfig;

export function loadConfig() {
    config = {
        port: process.env.PORT || 80,
        sslPort: process.env.SSLPORT || 443,
        skapUrl: process.env.SKAPURL || "wss://skap.io",
        debugMode: parseBool(process.env.DEBUGMODE, false),
        playerCountIntervalMs: parseNumber(process.env.PLAYERCOUNTINTERVALMS, 10000),
        ssl: parseBool(process.env.SSL, false),
        privateKey: process.env.PRIVATEKEY || "",
        certificate: process.env.CERTIFICATE || ""
    };
}

export interface TokeiConfig {
    port: number | string,
    sslPort: number | string,
    skapUrl: string,
    debugMode: boolean,
    // How often in milliseconds should we ask the server what the player count is?
    playerCountIntervalMs: number,
    ssl: boolean,
    privateKey: string,
    certificate: string
}
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

export const config: TokeiConfig = {
    port: process.env.PORT || 80,
    sslPort: process.env.SSLPORT || 443,
    skapUrl: process.env.skapUrl || "wss://skap.io",
    debugMode: parseBool(process.env.debugMode, false),
    playerCountIntervalMs: parseNumber(process.env.playerCountIntervalMs, 10000),
    ssl: parseBool(process.env.ssl, false),
    privateKey: process.env.privateKey || "",
    certificate: process.env.certificate || ""
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
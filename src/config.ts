import dotenv from "dotenv";

dotenv.config();

export const config: TokeiConfig = {
    port: process.env.PORT || 80,
    sslPort: process.env.SSLPORT || 443,
    skapUrl: process.env.skapUrl || "wss://skap.io",
    debugMode: process.env.debugMode ? Boolean(process.env.debugMode) : false,
    playerCountIntervalMs: process.env.playerCountIntervalMs ? Number(process.env.playerCountIntervalMs) : 10000,
    ssl: process.env.ssl ? Boolean(process.env.ssl) : false,
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
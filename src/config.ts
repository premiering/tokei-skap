import dotenv from "dotenv";

dotenv.config();

export const config: TokeiConfig = {
    port: process.env.PORT || 3000,
    skapUrl: process.env.skapUrl || "wss://skap.io",
    debugMode: process.env.debugMode ? Boolean(process.env.debugMode) : false,
    playerCountIntervalMs: process.env.playerCountIntervalMs ? Number(process.env.playerCountIntervalMs) : 10000
}

export interface TokeiConfig {
    port: number | string,
    skapUrl: string,
    debugMode: boolean,
    // How often in milliseconds should we ask the server what the player count is?
    playerCountIntervalMs: number
}
import { calculateAreaScore, getTrackedNameFromArea, isAreaTracked } from "./areas";
import { config } from "./config";
import { updateHighest } from "./db";
import { GAMES_PACKET, TokeiSocket, UPDATE_STATES_PACKET } from "./socket";
import { tokeiLog } from "./util";

interface TokeiBotState {
    lastPlayerCount: number,
    connectedToOverworld: boolean,
    achievedCache: Map<string, Map<string, number>>
}

function defaultBotState(): TokeiBotState {
    return {
        lastPlayerCount: 0,
        connectedToOverworld: false,
        achievedCache: new Map<string, Map<string, number>>()
    };
}

let tokeiSocket: TokeiSocket;
let botData: TokeiBotState = defaultBotState();

export async function initTokeiBot() {
    if (tokeiSocket && tokeiSocket.isOpen()) {
        throw new Error("TokeiBot is still currently running!");
    }
    let playerCountChecker: NodeJS.Timeout;
    const socket = new TokeiSocket(config.skapUrl);
    socket.onLogin(() => {
        tokeiLog("logged in as " + socket.getBotUsername());
        setTimeout(() => {
            socket.sendRequestGamesList();
        }, 1000)
        playerCountChecker = setInterval(() => {
            socket.sendRequestGamesList();
        }, config.playerCountIntervalMs)
    });
    socket.onClose(() => {
        // Reset the state of the bot since we've been reset.
        botData = defaultBotState();
    });
    socket.onPacket(GAMES_PACKET, updatePlayerCount);
    socket.onPacket(UPDATE_STATES_PACKET, updateAreaAchievements);
    tokeiSocket = socket;
}

export function getBotUsername(): string {
    return tokeiSocket.getBotUsername();
}

export function getLastPlayerCount(): number {
    return botData.lastPlayerCount - 1;
}

function updatePlayerCount(data: any) {
    // Connect to overworld if not yet connected
    if (!botData.connectedToOverworld) {
        const overworld = data.g[0];
        tokeiSocket.sendJoinGame(overworld.id);
        botData.connectedToOverworld = true;
    }

    let totalPlayerCount: number = 0;
    data.g.forEach((g: any) => {
        totalPlayerCount += g.players;
    })
    botData.lastPlayerCount = totalPlayerCount;
}

function updateAreaAchievements(data: any) {
    data.m.playerList.forEach((p: any) => {
        const name = p[0] as string;
        const currentArea = p[1] as string;

        if (isAreaTracked(currentArea)) {
            // Calculate our area score
            const areaScore = calculateAreaScore(currentArea);
            if (areaScore == undefined)
                return;

            // Insert a map for this area if not yet created
            const trackedName = getTrackedNameFromArea(currentArea);
            if (trackedName == undefined)
                return;
            if (!botData.achievedCache.has(trackedName)) {
                botData.achievedCache.set(trackedName, new Map());
            }
            const areaAchievedMap = botData.achievedCache.get(trackedName);

            if (areaAchievedMap?.has(name)) {
                const previousScore = areaAchievedMap.get(name) as number;
                if (areaScore <= previousScore)
                    return;
            }
            areaAchievedMap?.set(name, areaScore);
            updateHighest(name, currentArea, areaScore);
        }
    });
}
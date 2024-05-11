import { calculateAreaScore, getTrackedNameFromArea, isAreaTracked } from "./areas";
import { config } from "./config";
import { updateHighest } from "./db";
import { GAMES_PACKET, TokeiSocket, UPDATE_STATES_PACKET } from "./socket";
import { tokeiLog } from "./util";

interface TokeiBotData {
    lastPlayerCount: number,
    connectedToOverworld: boolean
}

let tokeiSocket: TokeiSocket;
let botData: TokeiBotData = {
    lastPlayerCount: 0,
    connectedToOverworld: false
};

const achievedCache = new Map<string, Map<string, number>>();

export async function initTokeiBot() {
    if (tokeiSocket && tokeiSocket.isOpen()) {
        throw new Error("TokeiBot is still currently running!");
    }
    let playerCountChecker: NodeJS.Timeout;
    const socket = new TokeiSocket(config.skapUrl);
    socket.onLogin(() => {
        setTimeout(() => {
            socket.sendRequestGamesList();
        }, 1000)
        playerCountChecker = setInterval(() => {
            socket.sendRequestGamesList();
        }, config.playerCountIntervalMs)
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
            if (!achievedCache.has(trackedName)) {
                achievedCache.set(trackedName, new Map());
            }
            const areaAchievedMap = achievedCache.get(trackedName);

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
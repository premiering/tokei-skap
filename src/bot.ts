import { calculateAreaScore, getLevelFromArea, isAreaTracked, timelyTrackedAreas } from "./areas";
import { config } from "./config";
import { updateAreaCompletion, updateTimelyCompletion } from "./db";
import { GAMES_PACKET, TokeiSocket, UPDATE_STATES_PACKET } from "./socket";
import { tokeiLog } from "./util";

interface TokeiBotState {
    lastPlayerCount: number,
    connectedToOverworld: boolean,
    completionCache: Map<string, Map<string, number>>,
    timelyRuns: Map<string, TimelyRunState>,
    lastUpdateState: Date
}

interface TimelyRunState {
    startTime: Date,
    runTicks: number,
    levelName: string,
    highestAreaScore: number
}

function defaultBotState(): TokeiBotState {
    return {
        lastPlayerCount: 0,
        connectedToOverworld: false,
        completionCache: new Map<string, Map<string, number>>(),
        timelyRuns: new Map<string, TimelyRunState>(),
        lastUpdateState: new Date()
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
    socket.onPacket(UPDATE_STATES_PACKET, updateLastUpdateTime);
    socket.onPacket(UPDATE_STATES_PACKET, updateCompletionsLeaderboards);
    socket.onPacket(UPDATE_STATES_PACKET, updateTimelyLeaderboards);
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
    if (!botData.connectedToOverworld || 
        (new Date().getTime() - botData.lastUpdateState.getTime()) > config.playerCountIntervalMs
    ) {
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

function updateLastUpdateTime(data: any) {
    botData.lastUpdateState = new Date();
}

function updateCompletionsLeaderboards(data: any) {
    data.m.playerList.forEach((p: any) => {
        const name = p[0] as string;
        const currentArea = p[1] as string;

        if (isAreaTracked(currentArea)) {
            // Calculate our area score
            const areaScore = calculateAreaScore(currentArea);
            if (areaScore == undefined)
                return;

            // Insert a map for this area if not yet created
            const trackedName = getLevelFromArea(currentArea);
            if (trackedName == undefined)
                return;
            if (!botData.completionCache.has(trackedName)) {
                botData.completionCache.set(trackedName, new Map());
            }
            const areaAchievedMap = botData.completionCache.get(trackedName);

            if (areaAchievedMap?.has(name)) {
                const previousScore = areaAchievedMap.get(name) as number;
                if (areaScore <= previousScore)
                    return;
            }
            areaAchievedMap?.set(name, areaScore);
            updateAreaCompletion(name, currentArea, areaScore);
        }
    });
}

function updateTimelyLeaderboards(data: any) {
    data.m.playerList.forEach((p: any) => {
        const name = p[0] as string;
        const currentArea = p[1] as string;

        if (isAreaTracked(currentArea)) {
            const currentTimelyRun = botData.timelyRuns.get(name);
            const areaScore = calculateAreaScore(currentArea);
            if (areaScore == undefined)
                return;
            const levelName = getLevelFromArea(currentArea);
            if (levelName == undefined)
                return;
            if (currentTimelyRun == undefined || currentTimelyRun?.levelName != levelName) {
                if (areaScore == 1) {
                    // This is the start of the run then
                    botData.timelyRuns.set(name, {
                        startTime: new Date(),
                        levelName: levelName,
                        highestAreaScore: areaScore,
                        runTicks: 0
                    });
                }
                return;
            }

            if (areaScore > currentTimelyRun.highestAreaScore) {
                for (const tracked of timelyTrackedAreas) {
                    if (tracked.levelName != levelName)
                        continue;
                    const trackedAreaScore = calculateAreaScore(tracked.areaToReach) as number;
                    if (currentTimelyRun.highestAreaScore >= trackedAreaScore)
                        continue;

                    if (areaScore == trackedAreaScore)
                        updateTimelyCompletion(name, tracked, new Date().getTime() - currentTimelyRun.startTime.getTime(), currentTimelyRun.runTicks);
                }
                currentTimelyRun.highestAreaScore = areaScore;
            }
            currentTimelyRun.runTicks++;
        }
    });
}
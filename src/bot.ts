import { calculateAreaScore, getLevelFromArea, isAreaTracked, timelyTrackedAreas } from "./areas";
import { config } from "./config";
import { getLastSecondaryRoomId, updateAreaCompletion, updateTimelyCompletion } from "./db";
import { CREATE_GAME_PACKET, GAMES_PACKET, LOGIN_PACKET, LOGIN_RESULT_PACKET, TokeiSocket, UPDATE_STATES_PACKET } from "./socket";
import { tokeiLog } from "./util";

interface TokeiBotState {
    lastPlayerCount: number,
    completionCache: Map<string, Map<string, number>>,
    timelyRuns: Map<string, TimelyRunState>
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
        completionCache: new Map<string, Map<string, number>>(),
        timelyRuns: new Map<string, TimelyRunState>()
    };
}

export class TokeiBot {
    protected socket: TokeiSocket;
    protected botData: TokeiBotState = defaultBotState();

    constructor(socket: TokeiSocket) {
        this.socket = socket;
        this.setupSocket(socket);
    }

    public setupSocket(socket: TokeiSocket) {
        socket.onLogin(() => {
            tokeiLog("logged in as " + socket.getBotUsername());
            setTimeout(() => {
                socket.sendRequestGamesList();
            }, 1000)
            setInterval(() => {
                socket.sendRequestGamesList();
            }, config.playerCountIntervalMs)
        });
        socket.onClose(() => {
            // Reset the state of the bot since we've been reset.
            this.botData = defaultBotState();
        });
        socket.onPacket(GAMES_PACKET, (data: any) => { this.updatePlayerCount(data) });
        socket.onPacket(UPDATE_STATES_PACKET, (data: any) => { this.updateCompletionsLeaderboards(data) });
        socket.onPacket(UPDATE_STATES_PACKET, (data: any) => { this.updateTimelyLeaderboards(data) });
    }

    public getBotUsername(): string {
        return this.socket.getBotUsername();
    }

    public getLastPlayerCount(): number {
        return this.botData.lastPlayerCount - 1;
    }

    public updatePlayerCount(data: any) {
        let totalPlayerCount: number = 0;
        data.g.forEach((g: any) => {
            totalPlayerCount += g.players;
        })
        this.botData.lastPlayerCount = totalPlayerCount;
    }

    public updateCompletionsLeaderboards(data: any) {
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
                if (!this.botData.completionCache.has(trackedName)) {
                    this.botData.completionCache.set(trackedName, new Map());
                }
                const areaAchievedMap = this.botData.completionCache.get(trackedName);

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

    public updateTimelyLeaderboards(data: any) {
        data.m.playerList.forEach((p: any) => {
            const name = p[0] as string;
            const currentArea = p[1] as string;

            const areaTracked = isAreaTracked(currentArea);
            if (!areaTracked) {
                this.botData.timelyRuns.delete(name);
                return;
            }
            const currentTimelyRun = this.botData.timelyRuns.get(name);
            const areaScore = calculateAreaScore(currentArea);
            const levelName = getLevelFromArea(currentArea);

            if (areaScore == undefined || levelName == undefined) {
                if (currentTimelyRun != undefined)
                    this.botData.timelyRuns.delete(name);
                return;
            }
            if (currentTimelyRun == undefined || currentTimelyRun?.levelName != levelName) {
                if (areaScore == 1) {
                    // This is the start of the run then
                    this.botData.timelyRuns.set(name, {
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
        });

    }
}

export class TokeiOverworldBot extends TokeiBot {
    public setupSocket(socket: TokeiSocket): void {
        super.setupSocket(socket);
        this.socket.onPacket(GAMES_PACKET, (data: any) => { this.connectToOverworld(data) });
    }

    public connectToOverworld(data: any) {
        const overworld = data.g[0];
        this.socket.sendJoinGame(overworld.id);
    }
}

export class TokeiSecondaryOverworldbot extends TokeiBot {
    public setupSocket(socket: TokeiSocket): void {
        super.setupSocket(socket);
        this.socket.onLogin((data: any) => { setTimeout(() => { this.createSecondaryOverworld(data) }, 1000) });
    }

    public createSecondaryOverworld(data: any) {
        const settings = {
            n: "overworld 2",
            g: false,
            p: false,
            pa: "",
            r: false,
            rd: [],
            u: false,
            s: false
        };
        this.socket.send(CREATE_GAME_PACKET, {
            s: settings
        });
        tokeiLog("created Overworld 2")
    }
}

export function initTokeiBot(): TokeiBot {
    const socket = new TokeiSocket(config.skapUrl);
    const bot = new TokeiOverworldBot(socket);
    return bot;
}

export function initSecondaryTokeiBot(): TokeiBot {
    const socket = new TokeiSocket(config.skapUrl);
    const bot = new TokeiSecondaryOverworldbot(socket);
    return bot;
} 
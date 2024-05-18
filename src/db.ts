import { tokeiDebug, tokeiLog } from "./util";
import sqlite3 from 'sqlite3'
import { Database, open } from 'sqlite'
import { TrackedTimelyArea, getLevelFromArea, isAreaTimelyTracked, timelyTrackedAreas, trackedLevels } from "./areas";
sqlite3.verbose();

export interface CompletionLeaderboardPlacement {
    playerName: string,
    areaReached: string,
    dateReached: Date
}

export interface CompletionLeaderboard {
    areaName: string,
    placements: CompletionLeaderboardPlacement[]
}

export interface TimelyLeaderboardPlacement {
    playerName: string,
    dateReached: Date,
    timeReachedMs: number
}

export interface TimelyLeaderboard {
    areaName: string,
    placements: TimelyLeaderboardPlacement[]
}

const LEVEL_COMPLETION_TABLE_SCHEMA = "( PlayerName string, TimeAchieved DATETIME, AreaName string, AreaScore double )";
const TIMELY_COMPLETION_TABLE_SCHEMA = "( PlayerName string, TimeAchieved DATETIME, RunTime integer, RunTicks integer )";
const SECONDARY_OVERWORLD_ROOMS_SCHEMA = "( RoomId string, TimeCreated DATETIME )";
const SECONDARY_OVERWORLD_ROOMS_TABLE_NAME = "SecondaryOverworldRooms";
let LAST_SECONDARY_ROOM_ID: string = "";
export let db: Database<sqlite3.Database, sqlite3.Statement>;

export function getLastSecondaryRoomId(): string {
    return LAST_SECONDARY_ROOM_ID;
}

export async function initSqlite(): Promise<void> {
    return open({
        filename: './stats.db',
        driver: sqlite3.Database
    }).then((loadedDb) => {
        db = loadedDb;
        onDatabaseLoad();
    }).catch((err) => {
        tokeiLog("error encountered in loading sqlite");
        console.error(err);
        process.exit();
    });
}

export async function updateAreaCompletion(playerName: string, areaName: string, areaScore: number) {
    tokeiDebug(`updating highest: ${playerName}, ${areaName}`);
    const trackedName = getLevelFromArea(areaName);
    if (trackedName == undefined)
        return;
    const tableName = getCompletionTableFromArea(trackedName);
    const result = await db.get(`SELECT * FROM ${tableName} WHERE PlayerName = ?`, playerName);
    if (!result) {
        await db.run(
            `INSERT INTO ${tableName} (PlayerName, TimeAchieved, AreaName, AreaScore) VALUES (?, CURRENT_TIMESTAMP, ?, ?)`, 
            playerName, 
            areaName, 
            areaScore
        );
        tokeiDebug(`inserted record: (${playerName}, ${areaName}, ${areaScore})`);
    } else if (areaScore > result.AreaScore) {
        await db.run(
            `UPDATE ${tableName} SET AreaName = ?, TimeAchieved = CURRENT_TIMESTAMP, AreaScore = ? WHERE PlayerName = ?`, 
            areaName, 
            areaScore, 
            playerName
        );
        tokeiDebug(`updated record: (${playerName}, ${areaName}, ${areaScore})`);
    }
}

export async function updateTimelyCompletion(playerName: string, trackedArea: TrackedTimelyArea, runTimeMs: number, runTicks: number) {
    const tableName = getTimelyTableFromArea(trackedArea.areaToReach);
    const result = await db.get(`SELECT * FROM ${tableName} WHERE PlayerName = ?`, playerName);
    if (!result) {
        await db.run(
            `INSERT INTO ${tableName} (PlayerName, TimeAchieved, RunTime, RunTicks) VALUES (?, CURRENT_TIMESTAMP, ?, ?)`, 
            playerName,  
            runTimeMs,
            runTicks
        );
        tokeiDebug(`inserted timely record: (${playerName}, ${trackedArea.areaToReach}, ${runTimeMs})`);
    } else if (runTimeMs < result.RunTime) {
        await db.run(
            `UPDATE ${tableName} SET RunTime = ?, RunTicks = ?, TimeAchieved = CURRENT_TIMESTAMP WHERE PlayerName = ?`, 
            runTimeMs,
            runTicks,
            playerName
        );
        tokeiDebug(`updated record: (${playerName}, ${trackedArea.areaToReach}, ${runTicks}, ${runTimeMs})`);
    }
}

export async function addSecondaryOverworldRoom(roomId: string) {
    await db.run(
        `INSERT INTO ${SECONDARY_OVERWORLD_ROOMS_TABLE_NAME} (RoomId, TimeCreated) VALUE (?, CURRENT_TIMESTAMP)`,
        roomId
    );
    tokeiDebug("added secondary overworld room: " + roomId);
}

export async function getCompletionLevelLeaderboards(limit: number, area: string): Promise<CompletionLeaderboard | undefined> {
    const trackedName = getLevelFromArea(area);
    if (trackedName == undefined)
        return undefined;
    const tableName = getCompletionTableFromArea(trackedName);
    const players = await db.all(`SELECT * FROM ${tableName} ORDER BY AreaScore DESC, TimeAchieved ASC LIMIT ${limit}`)

    let placements: CompletionLeaderboardPlacement[] = [];

    players.forEach((p) => {
        placements.push({
            playerName: p.PlayerName,
            dateReached: p.TimeAchieved,
            areaReached: p.AreaName
        });
    })

    return {
        areaName: trackedName,
        placements
    }
}

export async function getTimelyAreaLeaderboards(limit: number, area: string): Promise<TimelyLeaderboard | undefined> {
    if (!isAreaTimelyTracked(area))
        return undefined;
    const tableName = getTimelyTableFromArea(area);
    const players = await db.all(`SELECT * FROM ${tableName} ORDER BY RunTime ASC, TimeAchieved ASC LIMIT ${limit}`);

    let placements: TimelyLeaderboardPlacement[] = [];

    players.forEach((p) => {
        placements.push({
            playerName: p.PlayerName,
            dateReached: p.TimeAchieved,
            timeReachedMs: p.RunTime
        });
    })

    return {
        areaName: area,
        placements
    }
}

async function onDatabaseLoad() {
    tokeiLog("sqlite ./stats.db is loaded");
    trackedLevels.forEach((level) => {
        const tableName = getCompletionTableFromArea(level);
        tokeiDebug("creating if doesnt exist table " + tableName);
        db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} ${LEVEL_COMPLETION_TABLE_SCHEMA}`);
    })
    timelyTrackedAreas.forEach((area) => {
        const tableName = getTimelyTableFromArea(area.areaToReach);
        tokeiDebug("creating if doesnt exist table " + tableName);
        db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} ${TIMELY_COMPLETION_TABLE_SCHEMA}`);
    })
    db.exec(`CREATE TABLE IF NOT EXISTS ${SECONDARY_OVERWORLD_ROOMS_TABLE_NAME} ${SECONDARY_OVERWORLD_ROOMS_SCHEMA}`);

    const result = await db.all(`SELECT * FROM ${SECONDARY_OVERWORLD_ROOMS_TABLE_NAME} ORDER BY TimeCreated DESC LIMIT 1`);
    if (result.length > 0) {
        const last = result[0];
        LAST_SECONDARY_ROOM_ID = last.RoomId;
    }
}

function getCompletionTableFromArea(trackedName: string): string {
    return trackedName.replaceAll(' ', '') + "Highest";
}

function getTimelyTableFromArea(areaName: string): string {
    return areaName.replaceAll(' ', '') + "Timely";
}
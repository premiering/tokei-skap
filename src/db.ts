import { randomHexString, tokeiDebug, tokeiLog } from "./util";
import WebSocket = require("ws");
import sqlite3 from 'sqlite3'
import { Database, open } from 'sqlite'
import { TrackedTimelyArea, getLevelFromArea, isAreaTimelyTracked, timelyTrackedAreas, trackedLevels } from "./areas";
import { run } from "node:test";

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
const TIMELY_COMPLETION_TABLE_SCHEMA = "( PlayerName string, TimeAchieved DATETIME, RunTime integer )";
export let db: Database<sqlite3.Database, sqlite3.Statement>;

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

export async function updateTimelyCompletion(playerName: string, trackedArea: TrackedTimelyArea, runTimeMs: number) {
    const tableName = getTimelyTableFromArea(trackedArea.areaToReach);
    const result = await db.get(`SELECT * FROM ${tableName} WHERE PlayerName = ?`, playerName);
    if (!result) {
        await db.run(
            `INSERT INTO ${tableName} (PlayerName, TimeAchieved, RunTime) VALUES (?, CURRENT_TIMESTAMP, ?)`, 
            playerName,  
            runTimeMs
        );
        tokeiDebug(`inserted timely record: (${playerName}, ${trackedArea.areaToReach}, ${runTimeMs})`);
    } else if (runTimeMs < result.RunTime) {
        await db.run(
            `UPDATE ${tableName} SET RunTime = ?, TimeAchieved = CURRENT_TIMESTAMP WHERE PlayerName = ?`, 
            runTimeMs,
            playerName
        );
        tokeiDebug(`updated record: (${playerName}, ${trackedArea.areaToReach}, ${runTimeMs})`);
    }
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
    const players = await db.all(`SELECT * FROM ${tableName} ORDER BY RunTime DESC, TimeAchieved ASC LIMIT ${limit}`)

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

function onDatabaseLoad() {
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
}

function getCompletionTableFromArea(trackedName: string): string {
    return trackedName.replaceAll(' ', '') + "Highest";
}

function getTimelyTableFromArea(areaName: string): string {
    return areaName.replaceAll(' ', '') + "Timely";
}
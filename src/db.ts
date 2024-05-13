import { randomHexString, tokeiDebug, tokeiLog } from "./util";
import WebSocket = require("ws");
import sqlite3 from 'sqlite3'
import { Database, open } from 'sqlite'
import { getTrackedNameFromArea, trackedAreas } from "./areas";

sqlite3.verbose();

export interface AreaLeaderboardPlacement {
    playerName: string,
    areaReached: string,
    dateReached: Date
}

export interface AreaLeaderboard {
    areaName: string,
    placements: AreaLeaderboardPlacement[]
}

const HIGHEST_AREA_TABLE_SCHEMA = "( PlayerName string, TimeAchieved DATETIME, AreaName string, AreaScore double )";
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

export async function updateHighest(playerName: string, areaName: string, areaScore: number) {
    tokeiDebug(`updating highest: ${playerName}, ${areaName}`);
    const trackedName = getTrackedNameFromArea(areaName);
    if (trackedName == undefined)
        return;
    const tableName = getTableFromArea(trackedName);
    const result = await db.get(`SELECT * FROM ${tableName} WHERE PlayerName = ?`, playerName);
    if (!result) {
        insertAchievedRow(tableName, playerName, areaName, areaScore);
    } else if (areaScore > result.AreaScore) {
        updateAchievedRow(tableName, playerName, areaName, areaScore)
    }
}

async function insertAchievedRow(tableName: string, playerName: string, areaName: string, areaScore: number) {
    await db.run(
        `INSERT INTO ${tableName} (PlayerName, TimeAchieved, AreaName, AreaScore) VALUES (?, CURRENT_TIMESTAMP, ?, ?)`, 
        playerName, 
        areaName, 
        areaScore
    );
    tokeiDebug(`inserted record: (${playerName}, ${areaName}, ${areaScore})`);
}

async function updateAchievedRow(tableName: string, playerName: string, areaName: string, areaScore: number) {
    await db.run(
        `UPDATE ${tableName} SET AreaName = ?, TimeAchieved = CURRENT_TIMESTAMP, AreaScore = ? WHERE PlayerName = ?`, 
        areaName, 
        areaScore, 
        playerName
    );
    tokeiDebug(`updated record: (${playerName}, ${areaName}, ${areaScore})`);
}

export async function getAreaLeaderboards(limit: number, area: string): Promise<AreaLeaderboard | undefined> {
    const trackedName = getTrackedNameFromArea(area);
    if (trackedName == undefined)
        return undefined;
    const tableName = getTableFromArea(trackedName);
    const players = await db.all(`SELECT * FROM ${tableName} ORDER BY AreaScore DESC, TimeAchieved ASC`)

    let placements: AreaLeaderboardPlacement[] = [];

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

function onDatabaseLoad() {
    tokeiLog("sqlite ./stats.db is loaded");
    trackedAreas.forEach((area) => {
        tokeiDebug("creating if doesnt exist table " + getTableFromArea(area));
        db.exec(`CREATE TABLE IF NOT EXISTS ${getTableFromArea(area)} ${HIGHEST_AREA_TABLE_SCHEMA}`);
    })
}

function getTableFromArea(trackedName: string) {
    return trackedName.replace(' ', '') + "Highest";
}
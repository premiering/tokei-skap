import express, { Express, Request, Response } from "express";
import { getBotUsername, getLastPlayerCount } from "./bot";
import { isAreaTimelyTracked, isAreaTracked, timelyTrackedAreas, trackedLevels } from "./areas";
import { getCompletionLevelLeaderboards, getTimelyAreaLeaderboards } from "./db";
import { tokeiLog } from "./util";
import { config } from "./config";

const http = require('http');
const https = require('https');
const fs = require('fs');
const cors = require('cors')
const app: Express = express();

async function routeHomePage(req: Request, res: Response) {
    res.render('index', {
        usernameText: "Its current username on Skap is " + getBotUsername(),
        playerCountText: "There's currently " + getLastPlayerCount() + " players on Skap"
    })
}

async function routePlayerCount(req: Request, res: Response) {
    res.send({
        playerCount: getLastPlayerCount()
    });
}

async function routeUsername(req: Request, res: Response) {
    res.send({
        username: getBotUsername()
    });
}

async function routeCompletionLeaderboard(req: Request, res: Response) {
    let limit = 35;
    if (req.query.limit) {
        limit = Number(req.query.limit);
        if (limit <= 0 || Number.isNaN(limit))
            return invalidRequest(res, "Limit cannot be this NaN or <= 0!");
        if (limit > 250)
            return invalidRequest(res, "Limit cannot be higher than 250!");
    }

    const area = req.query.area;
    if (!area)
        return invalidRequest(res, "Params must include an area");

    if (!isAreaTracked(area as string))
        return invalidRequest(res, "That's not a tracked area, tracked areas are " + JSON.stringify(trackedLevels));
    const resultLeaderboard = await getCompletionLevelLeaderboards(limit, area as string);
    if (resultLeaderboard == undefined)
        return serverError(res, "");
    res.send(resultLeaderboard);
}

async function routeTimelyLeaderboard(req: Request, res: Response) {
    let limit = 35;
    if (req.query.limit) {
        limit = Number(req.query.limit);
        if (limit <= 0 || Number.isNaN(limit))
            return invalidRequest(res, "Limit cannot be this NaN or <= 0!");
        if (limit > 250)
            return invalidRequest(res, "Limit cannot be higher than 250!");
    }

    const area = req.query.area;
    if (!area)
        return invalidRequest(res, "Params must include an area");
    if (!isAreaTimelyTracked(area as string))
        return invalidRequest(res, "That's not a tracked timely area, tracked areas are " + JSON.stringify(timelyTrackedAreas));
    const resultLeaderboard = await getTimelyAreaLeaderboards(limit, area as string);
    if (resultLeaderboard == undefined)
        return serverError(res, "");
    res.send(resultLeaderboard);
}

function invalidRequest(res: Response, message: string) {
    res.status(400).send({
        error: "Invalid request",
        message: message
    });
}

function serverError(res: Response, message: string) {
    res.status(500).send({
        error: "Server error",
        message: message
    });
}

export function initExpressApi() {
    app.use(cors());
    app.use(express.static('public'));
    app.set('view engine', 'pug');

    app.get("/", routeHomePage);
    app.get("/api/playerCount", routePlayerCount);
    app.get("/api/username", routeUsername)
    app.get("/api/leaderboard/completion", routeCompletionLeaderboard);
    app.get("/api/leaderboard/timely", routeTimelyLeaderboard);

    http.createServer(app).listen(config.port, () => {
        tokeiLog(`HTTP routes running - http://localhost:${config.port}`);
    });
    if (config.ssl) {
        https.createServer({ key: fs.readFileSync(config.privateKey), cert: fs.readFileSync(config.certificate) }, app).listen(config.sslPort, () => {
            tokeiLog(`HTTPS (with SSL) routes running - https://localhost:${config.sslPort}`);
        });
    }
}
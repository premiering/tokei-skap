import { tokeiLog } from "./util";
import { config, loadConfig } from "./config";
import { Bot, initSecondaryOverworldBot, initBot } from "./bot";
import { getCompletionLevelLeaderboards, getTimelyAreaLeaderboards, initSqlite } from "./db";
import { initExpressApi } from "./api";
import { timelyTrackedAreas, trackedLevels } from "./areas";
import fs from 'node:fs';

export let overworldBot: Bot;
export let secondaryOverworldBot: Bot;

async function run() {
  tokeiLog("loading with the following settings:")
  loadConfig();
  Object.keys(config).forEach((key: string) => {
    tokeiLog(`  ${key}: ${(config as any)[key]}`);
  });

  if (config.allowInvalidSkapSSL) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '0';
  }

  await initSqlite();
  //overworldBot = initBot();
  //if (config.secondaryOverworldBot)
    //secondaryOverworldBot = initSecondaryOverworldBot();
  //initExpressApi();

  fs.mkdirSync("cache/timely", {recursive: true});
  fs.mkdirSync("cache/completion", {recursive: true});

  for (const area of timelyTrackedAreas) {
    const data = await getTimelyAreaLeaderboards(100000, area.areaToReach);
    const filename = `cache/timely/${area.areaToReach}.json`;
    fs.writeFile(filename, JSON.stringify(data), err => {
      if (err) {
        console.error(err);
      }
    });
    tokeiLog("writing timely cache: " + filename);
  }
  for (let level of trackedLevels) {
    const data = await getCompletionLevelLeaderboards(100000, level);
    const filename = `cache/completion/${level}.json`;
    fs.writeFile(filename, JSON.stringify(data), err => {
      if (err) {
        console.error(err);
      }
    });
    tokeiLog("writing completion cache: " + filename);
  }
}

run();
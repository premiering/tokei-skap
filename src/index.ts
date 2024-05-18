import { tokeiLog } from "./util";
import { config, loadConfig } from "./config";
import { TokeiBot, initSecondaryTokeiBot, initTokeiBot } from "./bot";
import { initSqlite } from "./db";
import { initExpressApi } from "./api";

export let overworldBot: TokeiBot;
export let secondaryOverworldBot: TokeiBot;

async function run() {
  tokeiLog("loading with the following settings:")
  loadConfig();
  Object.keys(config).forEach((key: string) => {
    tokeiLog(`  ${key}: ${(config as any)[key]}`);
  });

  await initSqlite();
  overworldBot = initTokeiBot();
  secondaryOverworldBot = initSecondaryTokeiBot();
  initExpressApi();
}

run();
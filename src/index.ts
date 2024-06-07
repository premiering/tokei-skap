import { tokeiLog } from "./util";
import { config, loadConfig } from "./config";
import { Bot, initSecondaryOverworldBot, initBot } from "./bot";
import { initSqlite } from "./db";
import { initExpressApi } from "./api";

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
  overworldBot = initBot();
  if (config.secondaryOverworldBot)
    secondaryOverworldBot = initSecondaryOverworldBot();
  initExpressApi();
}

run();
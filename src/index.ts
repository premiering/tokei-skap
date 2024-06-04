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

  if (config.allowInvalidSkapSSL) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '0';
  }

  await initSqlite();
  overworldBot = initTokeiBot();
  if (config.secondaryOverworldBot)
    secondaryOverworldBot = initSecondaryTokeiBot();
  initExpressApi();
}

run();
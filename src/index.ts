import { tokeiLog } from "./util";
import { config, loadConfig } from "./config";
import { initTokeiBot } from "./bot";
import { initSqlite } from "./db";
import { initExpressApi } from "./api";

async function run() {
  tokeiLog("loading with the following settings:")
  loadConfig();
  Object.keys(config).forEach((key: string) => {
    tokeiLog(`    ${key}: ${(config as any)[key]}`);
  });

  await initSqlite();
  await initTokeiBot();
  initExpressApi();
}

run();
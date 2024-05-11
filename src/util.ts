import chalk from "chalk";
import { config } from "./config";

export function randomHexString(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export function tokeiLog(d: unknown) {
  const now = new Date();
  console.log(
    chalk.black.bold(now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds()) +
    " " +
    chalk.greenBright.bold("[tokei-skap]") +
    ": " +
    d
  );
}

export function tokeiDebug(d: unknown) {
  if (!config.debugMode)
    return;
  const now = new Date();
  console.log(
    chalk.black.bold(now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds()) +
    " " +
    chalk.redBright.bold("[tokei-debug]") +
    ": " +
    d
  );
}
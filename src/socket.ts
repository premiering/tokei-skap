import { decode, encode } from "@msgpack/msgpack";
import { WebSocket } from "ws";
import { randomHexString, tokeiLog } from "./util";
import { buffer } from "stream/consumers";

export type PacketListener = (packet: any) => void;
export type CallbackListener = () => void;
export type LoginListener = (username: string) => void;

export const GAMES_PACKET = "games"
export const LOGIN_RESULT_PACKET = "result";
export const LOGIN_PACKET = "login";
export const SESSION_PACKET = "session";
export const JOIN_PACKET = "join";
export const UPDATE_STATES_PACKET = "updateStates";

export class TokeiSocket {
    private ws: WebSocket;
    private sendFunction: (e: string, data: any) => void;
    private packetListeners: Map<string, PacketListener> = new Map();
    private openListeners: CallbackListener[] = [];
    private closeListeners: CallbackListener[] = [];
    private loginListeners: LoginListener[] = [];
    private username: string;
    private password: string;

    constructor(url: string) {
        const ws = new WebSocket(url);
        const send = (e: string, data: any) => {
            data.e = e;
            const packed = encode(data);
            ws.send(packed);
        }
        this.sendFunction = send;
        this.username = "tokei" + randomHexString(10);
        this.password = randomHexString(12);
        ws.binaryType = 'arraybuffer';
        ws.on('open', () => {
            tokeiLog("connected to Skap");
            send("register", {
                m: {
                    username: this.username,
                    password: this.password
                }
            })
            this.openListeners.forEach((listener) => {
                listener();
            });
        });
        ws.on('error', (ws: WebSocket, err: Error) => {
            tokeiLog(err);
        });
        ws.on('message', (data: any) => {
            const packed = decode(new Uint8Array(data as ArrayBuffer)) as any;
            if (this.packetListeners.has(packed.e)) {
                (this.packetListeners.get(packed.e) as PacketListener)(packed);
            }
        });
        ws.on('close', (code: number, reason: Buffer) => {
            tokeiLog("lost connection to Skap, status: " + code);
            tokeiLog("buffer: " + buffer.toString());
            this.closeListeners.forEach((listener) => {
                listener();
            })
        })
        this.packetListeners.set(LOGIN_RESULT_PACKET, (data: any) => {
            this.loginListeners.forEach((listener) => {
                listener(this.username);
            })
        });
        this.ws = ws;
    }

    public getBotUsername(): string {
        return this.username;
    }

    public getBotPassword(): string {
        return this.password;
    }

    public isOpen(): boolean {
        return this.ws.readyState == this.ws.OPEN;
    }

    public onPacket(e: string, listener: PacketListener) {
        this.packetListeners.set(e, listener);
    }

    public onLogin(listener: LoginListener) {
        this.loginListeners.push(listener);
    }

    public onOpen(callback: CallbackListener) {
        this.openListeners.push(callback);
    }

    public onClose(callback: CallbackListener) {
        this.closeListeners.push(callback);
    }

    public send(e: string, data: any) {
        this.sendFunction(e, data);
    }

    public sendRequestGamesList() {
        this.send(GAMES_PACKET, {});
    }

    public sendJoinGame(id: any, password?: string) {
        if (password) {
            this.send(JOIN_PACKET, {
                g: id,
                p: password
            })
        } else {
            this.send(JOIN_PACKET, {
                g: id
            })
        }
    }
}
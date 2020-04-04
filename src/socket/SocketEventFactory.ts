import {Socket} from "socket.io";
import {SocketEventEmitter, SocketEventEmitterListener, SocketEventListener} from "./SocketEventEmitterListener";

export class SocketEventFactory {

    listenTimeout = 30000;
    constructor(public socket: Socket) {

    }

    createSocketEventEmitter<E>(eventName: string, socketId?: string){
        return new SocketEventEmitter<E>(this.getSocketToUse(socketId), eventName);
    }
    createSocketEventListener<L>(eventName: string, socketId?: string){
        return new SocketEventListener<L>(this.getSocketToUse(socketId), eventName)
    }
    createSocketEventEmitterListener<E,L>(eventName: string, socketId?: string, listenTimeout: number = this.listenTimeout){
        return new SocketEventEmitterListener<E,L>(this.getSocketToUse(socketId), eventName, listenTimeout)
    }

    private getSocketToUse(socketId: string) {
        return socketId ? this.socket.nsp.connected[socketId] : this.socket;
    }
}
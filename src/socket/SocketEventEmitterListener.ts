import {fromEvent, Observable} from "rxjs";
import {Socket} from "socket.io";
import {first, map, single, timeout} from "rxjs/internal/operators";




export class SocketEventEmitter<E> {

    constructor(public socket: Socket, public eventName: string) {

    }

    emit(data: E) {
        this.socket.emit(this.eventName, data);
    }
}


export class SocketEventListener<L> extends  SocketEventEmitter<never> {



    listen(): Observable<L> {
        return fromEvent<L>(this.socket,this.eventName)
    }

    listenOnce(): Observable<L> {
        return fromEvent<L>(this.socket,this.eventName).pipe(first());
    }

}


export class SocketEventEmitterListener<E,L> extends SocketEventListener<L>{

    constructor(public socket: Socket, public eventName: string, public listenTimeout: number) {
        super(socket, eventName)
    }
    emit(data: E, callback?: (resp: L) => void) {
        this.socket.emit(this.eventName, data, callback)
    }

    emitThenListen(data: E): Observable<L>  {
        const observable = this.listen();
        this.emit(data);
        return observable;
    }



    emitThenListenOnce(data: E): Observable<L>  {
        return new Observable<L>(subscriber => {
            this.emit(data,resp => {
                subscriber.next(resp);
                subscriber.complete();
            });
        }).pipe(timeout(this.listenTimeout))
    }

    listenWithCallback(): Observable<SocketDataWrapper<L, E>>  {
      return this.listen().pipe(map((args) => {
            return {data: args[0], callback: args[1]}
        } ))
    }

    listenWithCallbackOnce(): Observable<SocketDataWrapper<L, E>> {
        return this.listenOnce().pipe(map((args) => {
            return {data: args[0], callback: args[1]}
        } ))
    }
}

export type SocketDataWrapper<L,E> = { data:L, callback: (resp: E | string) => void}
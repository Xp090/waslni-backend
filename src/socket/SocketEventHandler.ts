import {Socket} from "socket.io";
import {Driver, DriverDocument, RiderDocument, User, UserDocument} from "../models/user";
import {GeoPointDB, LngLat} from "../models/location";
import {fromEvent, Observable, Subscription} from "rxjs";
import {SocketEventFactory} from "./SocketEventFactory";
import {RideRequest, RideRequestDocument} from "../models/ride-request";
import {DriverFinder} from "../util/driver-finder";
import {TripDocument} from "../models/trip";


export function SocketHandler(userSocket: Socket) {

    let handler = new SocketEventHandler(userSocket, (handler) => {
        console.log(`${handler.user.type} ${handler.user.email} ${handler.socket.id} is connected`);
        handler.user.socketId = handler.socket.id;
        handler.saveUser();
    });

    handler.onUserDisconnected().listenOnce().subscribe(() => {
        console.log(`${handler.user.type} ${handler.user.email} ${handler.socket.id} is disconnected`);
        handler.user.socketId = null;
        handler.saveUser();
        handler.disposeSubscriptions();
        handler = null;
    });

    handler.subscriptions = handler.onUserUpdateLocation().listen().subscribe(location => {
        handler.user.location = GeoPointDB.create(location);
        handler.saveUser();
    });
    handler.subscriptions = handler.onFindDriverRequestFromRider()
        .listenWithCallback().subscribe(({data: tripRequest, callback}) => {
            const driverFinder = new DriverFinder(handler,tripRequest);
            driverFinder.find(trip => {
                callback(trip)
           }, err => {
                callback(err)
           })
        });

}


export class SocketEventHandler {

    user: UserDocument = this.socket.request.user;
    socketEventFactory = new SocketEventFactory(this.socket);

    private _subscriptions = new Subscription();


    constructor(public socket: Socket, onConnection: (thisHandler: SocketEventHandler) => void) {
        this.onUserConnected(onConnection)
    }

    private onUserConnected(onConnection: (thisHandler: SocketEventHandler) => void) {
        onConnection(this);
    }

    saveUser() {
        this.user.save((err: any, product: UserDocument) => {
            if (err) console.error('socket user save error: ', err, product);
        });
    }


    onUserDisconnected() {
        return this.socketEventFactory.createSocketEventListener(SocketEvent.Disconnect)
    }

    onUserUpdateLocation() {
        return this.socketEventFactory.createSocketEventListener<LngLat>(SocketEvent.UpdateLocation);
    }

    onFindDriverRequestFromRider() {
        return this.socketEventFactory.createSocketEventEmitterListener<TripDocument, RideRequest>(SocketEvent.RiderFindDriverRequest);
    }

    sendTripRequestToDriver(socketId?: string) {
        return this.socketEventFactory
            .createSocketEventEmitterListener<RideRequestDocument, boolean>(SocketEvent.DriverListenForRiderRequest, socketId);
    }

    set subscriptions(subscription: Subscription) {
        this._subscriptions.add(subscription)
    }

    disposeSubscriptions() {
        this._subscriptions.unsubscribe();
    }

}

export type SocketEventFn<T = any, U = UserDocument> = (socket: Socket, user: U, data: T) => void;

export enum SocketEvent {
    Connection = 'connection',
    Disconnect = 'disconnect',
    UpdateLocation = "UpdateLocation",
    RiderFindDriverRequest = "RiderFindDriverRequest",
    DriverListenForRiderRequest = "DriverListenForRiderRequest"

}
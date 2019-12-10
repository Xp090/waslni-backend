import {Socket} from "socket.io";
import {Driver, User, UserDocument} from "../models/user";
import {GeoPointDB, LngLat} from "../models/location";
import {query} from "express-validator";

export function SocketHandler(userSocket: Socket) {
    const handler = new SocketEventHandler(userSocket,(socket, user) => {
        console.log(`${user.type} ${user.email} is connected`);
        user.socketConnected = true;
    });

    handler.onUserDisconnected((socket, user) => {
        console.log(`${user.type} ${user.email} is disconnected`);
        user.socketConnected = true;
    });

    handler.onUserUpdateLocation((socket, user, data) => {
        user.location = GeoPointDB.create(data);
        // if (user.type == "Driver") {
        //     socket.broadcast.to("5d9cf5527b996135f898bea9").emit(SocketEvent.DriverLocation,data);
        // }
    });
    handler.onFindDriverRequestFromRider((socket, user, data) => {
        Driver.find( { location: {
                    $nearSphere: {
                        // @ts-ignore
                        $geometry:user.location,
                        $maxDistance: 500000
                    } } })
            .find((err, drivers) => {
                if (err) return;
                if(drivers.length == 0){
                    socket.to(user.id).emit(SocketEvent.FindDriverResponseToRider,"no_driver_found");
                }
                const foundDriver = drivers[0];
                data.driver = foundDriver;
                data.rider = user;

                socket.broadcast.to(foundDriver.id).emit(SocketEvent.FindDriverRequestToDriver,data)
                //socket.emit(SocketEvent.FindDriverResponse,foundDriver)
            })
    });

    handler.onDriverRespondToRiderRequest((socket, user, data) => {
        if (data.driver == null) {
            socket.to(data.rider.id).emit(SocketEvent.FindDriverResponseToRider,"Driver Declined")
        }else{
            socket.to(data.rider.id).emit(SocketEvent.FindDriverResponseToRider,data.driver)
        }
    })
}


export class SocketEventHandler {
    socket: Socket;
    user: UserDocument;

    constructor(socket: Socket, socketConnectionEventFn: SocketEventFn) {
        this.socket = socket;
        this.user = socket.request.user;
        this.onUserConnected(socketConnectionEventFn)
    }

    onUserConnected(socketEventFn: SocketEventFn) {
        this.socket.join(this.user.id);
        socketEventFn(this.socket,this.user,null);
    }

    onUserDisconnected(socketEventFn: SocketEventFn) {
       this.socketEventFactory(SocketEvent.Disconnect,socketEventFn)
    }

    onUserUpdateLocation(socketEventFn: SocketEventFn<LngLat>) {
        this.socketEventFactory(SocketEvent.UpdateLocation,socketEventFn)
    }
    onFindDriverRequestFromRider(socketEventFn: SocketEventFn){
        this.socketEventFactory(SocketEvent.FindDriverRequestFromRider,socketEventFn)
    }
    onDriverRespondToRiderRequest(socketEventFn: SocketEventFn){
        this.socketEventFactory(SocketEvent.FindDriverResponseFromDriver,socketEventFn)
    }

    private socketEventFactory(eventName: string, socketEventFn: SocketEventFn) {
        this.socket.on(eventName,args => {
            socketEventFn(this.socket,this.user,args);
            this.user.save( (err: any, product: UserDocument) => {
                console.error('socket user save error: ',err, product);
            });
        })
    }
}

export type SocketEventFn<T = any, U = UserDocument> = (socket: Socket, user: U, data: T) => void;

export enum SocketEvent  {
    Connection = 'connection',
    Disconnect = 'disconnect',
    UpdateLocation = "UpdateLocation",
    DriverLocation = "DriverLocation",
    FindDriverRequestFromRider = "FindDriverRequestFromRider",
    FindDriverRequestToDriver = "FindDriverRequestToDriver",
    FindDriverResponseFromDriver = "FindDriverResponseFromDriver",
    FindDriverResponseToRider = "FindDriverResponseToRider",
}
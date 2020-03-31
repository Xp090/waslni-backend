import socketIo from "socket.io";
import * as http from "http";
import {RiderDocument, User, UserDocument} from "../models/user";
// @ts-ignore
import  jwtAuth = require('socketio-jwt-auth');
import {SESSION_SECRET} from "../util/secrets";
import {SocketEvent, SocketHandler} from "./SocketEventHandler";



export function initSocket(server: http.Server) {
    const io = socketIo(server);
    io.use(jwtAuth.authenticate({
        secret: SESSION_SECRET,
        algorithm: 'HS256',
    }, async function(token: any, done: any) {
        try {
            const user = await User.findById(token.user._id).exec();
            if (user) {
                return done(null, user);
            }else{
                done({error:"USER_NOT_FOUND"});
            }
        } catch (error) {
            done(error);
        }
    }));

    io.on(SocketEvent.Connection, SocketHandler);

    // io.on('connection', socket => {
    //     socket.on("asd",(args , callback) => {
    //         console.warn(args);
    //         callback("CALLED")
    //     });
    //     setTimeout(()=>{
    //         socket.emit("qwer","back", function (resp: any) {
    //             console.warn(resp)
    //         })
    //     },5000)
    //
    // });

}




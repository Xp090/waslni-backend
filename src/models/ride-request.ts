import mongoose, {Types} from "mongoose";
import {DriverDocument, RiderDocument, UserDocument} from "./user";
import {GeoPointDB, GeoPointSchema} from "./location";

export enum RideDriverResponse {
    RequestPending = 'RequestPending',
    RequestCanceledByRider = 'RequestCanceledByRider',
    RequestDeclinedByDriver = 'RequestDeclinedByDriver',
    RequestAcceptedByDriver = 'RequestAcceptedByDriver',
    RequestTimedOut = 'RequestTimedOut'
}

export type RideRequestDocument = mongoose.Document & {
    rider: mongoose.Types.ObjectId | RiderDocument,
    fromAddress: string,
    fromPoint: GeoPointDB,
    toAddress: string,
    toPoint: GeoPointDB,
    requestsSent: Map<String,SentRideRequest>
    requestStatus: RideDriverResponse
    acceptedDriver: mongoose.Types.ObjectId | DriverDocument
}

const rideRequestSchema = new mongoose.Schema({
    rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rider'
    },
    fromAddress: String,
    fromPoint: GeoPointSchema,
    toAddress: String,
    toPoint: GeoPointSchema,
    requestsSent: {
        type: Map,
        of: {
            driver: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Driver'
            },
            requestDate: {
                type: Date,
                default: new Date()
            },
            response: {
                type: String,
                enum: Object.keys(RideDriverResponse),
                default: RideDriverResponse.RequestPending
            },
            responseDate: Date

        }
    },
    acceptedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
    },
    requestStatus: {
        type: String,
        enum: Object.keys(RideDriverResponse),
        default: RideDriverResponse.RequestPending
    }
    // tripStatus:  {
    //     type: String,
    //     enum: ['RequestPending', 'RequestCanceledByRider', 'RequestCanceledByDriver', 'DriverOnTheWay', 'TripOngoing', 'TripEnded'],
    //     default: 'RequestPending'
    // }
}, {timestamps: true});


export const RideRequest = mongoose.model<RideRequestDocument>("RideRequest", rideRequestSchema);



export interface SentRideRequest {
    driver: mongoose.Types.ObjectId | DriverDocument,
    requestDate?: Date,
    response?: RideDriverResponse,
    responseDate?: Date
}

export enum TripStatus {
    RequestPending = 'RequestPending',
    RequestCanceledByRider = 'RequestCanceledByRider',
    RequestCanceledByDriver = 'RequestCanceledByDriver',
    DriverOnTheWay = 'DriverOnTheWay',
    TripOngoing = 'TripOngoing',
    TripEnded = 'TripEnded'
}

export interface TripEconomy {
    cost: number;
}

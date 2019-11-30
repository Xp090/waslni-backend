import mongoose from "mongoose";
import {DriverDocument, RiderDocument} from "./user";
import {GeoPointDB, MongooseGeoPoint} from "./location";

export type TripDocument  = mongoose.Document & {
    driver:DriverDocument,
    rider:RiderDocument,
    fromAddress: string,
    fromPoint: GeoPointDB,
    toAddress: string,
    toPoint: GeoPointDB,
    tripStatus: TripStatus
}

const tripSchema = new mongoose.Schema({
    driver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
    },
    rider:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rider'
    },
    fromAddress: String,
    fromPoint: MongooseGeoPoint,
    toAddress: String,
    toPoint: MongooseGeoPoint,
    tripStatus:  {
        type: String,
        enum: ['RequestPending', 'RequestCanceledByRider', 'RequestCanceledByDriver', 'DriverOnTheWay', 'TripOngoing', 'TripEnded'],
        default: 'RequestPending'
    }
},{timestamps: true});

export enum TripStatus {
    RequestPending = 'RequestPending',
    RequestCanceledByRider = 'RequestCanceledByRider',
    RequestCanceledByDriver = 'RequestCanceledByDriver',
    DriverOnTheWay = 'DriverOnTheWay',
    TripOngoing = 'TripOngoing',
    TripEnded = 'TripEnded'
}

export interface TripEconomy {
    cost:number;
}

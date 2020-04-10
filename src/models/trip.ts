import mongoose from "mongoose";
import {DriverDocument, RiderDocument} from "./user";
import {GeoPointDB, geoPointSchema} from "./location";
import {RideDriverResponse, RideRequestModel, RideRequestDocument, rideRequestSchema, SentRideRequest} from "./ride-request";
import mongooseAutoPopulate from "mongoose-autopopulate";


export enum TripStatus {
    DriverOnTheWayForPickUpPoint = 'DriverOnTheWayForPickUpPoint',
    DriverArrivedAtPickUpPoint = 'DriverOnTheWayForPickUpPoint',
    TripCanceledByRider = 'TripCanceledByRider',
    TripCanceledByDriver = 'TripCanceledByDriver',
    TripOngoing = 'TripOngoing',
    TripEnded = 'TripEnded'
}

export interface TripDocument extends mongoose.Document {

    rideRequest: mongoose.Types.ObjectId | RideRequestDocument
    tripStatus: TripStatus
}


const tripSchema = new mongoose.Schema({
    rideRequest: {
        type: rideRequestSchema,
    },
    tripStatus: {
        type: String,
        enum: Object.keys(TripStatus),
        default: TripStatus.DriverOnTheWayForPickUpPoint,
    }

}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret, options) => {
            delete ret._id;
            delete ret.rideRequest.requestsSent;
        },
        versionKey: false,
        virtuals: true
    }
});

tripSchema.plugin(mongooseAutoPopulate);

export const Trip = mongoose.model<TripDocument>("Trip", tripSchema);


export interface TripEconomy {
    cost: number;
}
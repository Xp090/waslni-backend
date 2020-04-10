import mongoose, {Types} from "mongoose";
import {DriverDocument, RiderDocument, UserDocument} from "./user";
import {GeoPointDB, geoPointSchema, LngLat} from "./location";
import mongooseAutoPopulate from "mongoose-autopopulate";


export enum RideDriverResponse {
    RequestPending = 'RequestPending',
    RequestCanceledByRider = 'RequestCanceledByRider',
    RequestDeclinedByDriver = 'RequestDeclinedByDriver',
    RequestAcceptedByDriver = 'RequestAcceptedByDriver',
    RequestTimedOut = 'RequestTimedOut'
}


export interface RideRequest  {
    pickupPoint: LngLat,
    pickupAddress: string,
    destinationPoint: LngLat,
    destinationAddress: string,
    rider?: RiderDocument
}

export interface RideRequestDocument extends mongoose.Document {
    rider: mongoose.Types.ObjectId | RiderDocument,
    pickupPoint: GeoPointDB,
    pickupAddress: string,
    destinationPoint: GeoPointDB,
    destinationAddress: string,
    requestsSent: Map<String,SentRideRequest>
    requestStatus: RideDriverResponse
    driver: mongoose.Types.ObjectId | DriverDocument
}

export const rideRequestSchema = new mongoose.Schema({
    rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rider',
        // autopopulate: true
    },
    pickupPoint: geoPointSchema,
    pickupAddress: String,
    destinationPoint: geoPointSchema,
    destinationAddress: String,

    requestsSent: {
        type: Map,
        of: {
            driver: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Driver',
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

        },
        default: new Map<string,SentRideRequest>(),

    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        // autopopulate: true
    },
    requestStatus: {
        type: String,
        enum: Object.keys(RideDriverResponse),
        default: RideDriverResponse.RequestPending
    }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret, options) => {
            delete ret._id;
            delete ret.requestsSent;
        },
        versionKey: false,
        virtuals: true
    }
});
rideRequestSchema.plugin(mongooseAutoPopulate);

export const RideRequestModel = mongoose.model<RideRequestDocument>("RideRequest", rideRequestSchema);



export interface SentRideRequest {
    driver: mongoose.Types.ObjectId | DriverDocument,
    requestDate?: Date,
    response?: RideDriverResponse,
    responseDate?: Date
}



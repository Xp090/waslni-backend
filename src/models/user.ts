import bcrypt from "bcrypt-nodejs";
import crypto from "crypto";
import mongoose, {Schema} from "mongoose";
import {GeoPointDB, geoPointSchema} from "./location";


const options = {discriminatorKey: 'type'};

export type UserDocument = mongoose.Document & {
    phone: string;
    email: string;
    password: string;
    passwordResetToken: string;
    passwordResetExpires: Date;
    comparePassword: comparePasswordFunction;
    tokens: AuthToken[];
    profile: {
        name: string;
        gender: string;
        picture: string;
        rating: number;
        birthDate: Date;
    }

    socketId: string,
    socketConnected: boolean,
    location: GeoPointDB

    type: 'Rider' | 'Driver'
};


type comparePasswordFunction = (candidatePassword: string, cb: (err: Error, isMatch: boolean) => (void)) => void;

export interface AuthToken {
    accessToken: string;
    kind: string;
}



const userSchema = new mongoose.Schema({
    phone: String,
    email: String,
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,

    tokens: Array,

    profile: {
        name: String,
        gender: String,
        picture: String,
        rating: Number
    },
    location: geoPointSchema,

    socketId: String,
    socketConnected: Boolean,
}, {timestamps: true, discriminatorKey: "type"});
userSchema.index({ "location": '2dsphere' });
/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
    const user = this as UserDocument;
    if (!user.isModified("password")) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
        cb(err, isMatch);
    });
};

userSchema.methods.comparePassword = comparePassword;

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function (size: number = 200) {
    if (!this.email) {
        return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto.createHash("md5").update(this.email).digest("hex");
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};


userSchema.set("toJSON", {
    transform: (doc, ret, options) => {
        delete ret._id;
        delete ret.password;
        delete ret.tokens;
    },
    versionKey: false,
    virtuals: true
});
export const User = mongoose.model<UserDocument>("User", userSchema);

export enum DriverStatus {
    Offline = 'Offline',
    Online = 'Online',
    WaitingForRequest = 'WaitingForRequest',
    PendingRequest = 'PendingRequest',
    OnTheWayForRider = 'OnTheWayForRider',
    ArrivedAtRider = 'ArrivedAtRider',
    OnTrip = 'OnTrip',
}

export enum RiderStatus {
    Offline = 'Offline',
    Online = 'Online',
    RequestingDriver = 'RequestingDriver',
    PendingRequest = 'PendingRequest',
    WaitingForDriver = 'WaitingForDriver',
    OnTrip = 'OnTrip',
}

export type DriverDocument = UserDocument & {
    status: DriverStatus,
    car: {
        plate: string,
        color: string,
        model: string
    }
};
export const Driver = User.discriminator<DriverDocument>("Driver", new mongoose.Schema({
    status: {
        type: String,
        enum: ['Offline', 'Online', 'WaitingForRequest', 'PendingRequest', 'OnTheWayForRider', 'ArrivedAtRider', 'OnTrip'],
        default: 'Offline'
    },
    car: {
        plate: String,
        color: String,
        model: String
    }
}, options));


export type RiderDocument = UserDocument & {
    status: RiderStatus,
    walletBalance: number,
};

export const Rider = User.discriminator<RiderDocument>("Rider", new mongoose.Schema({
    status: {
        type: String,
        enum: ['Offline', 'Online', 'RequestingDriver', 'PendingRequest', 'WaitingForDriver', 'OnTrip'],
        default: 'Offline'
    },
    walletBalance: Number,
}, options));


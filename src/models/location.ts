import mongoose from "mongoose";

export class GeoPointDB {
    readonly type = "Point";
    coordinates: number[] = [0, 0];

    constructor(longitude: number, latitude: number) {
        this.coordinates = [longitude, latitude];
    }

    static create(lngLat: LngLat) {
        return new GeoPointDB(lngLat.longitude, lngLat.latitude);
    }

    get longitude() {
        return this.coordinates[0] || 0
    }

    set longitude(value: number) {
        this.coordinates[0] = value
    }

    get latitude() {
        return this.coordinates[1] || 0
    }

    set latitude(value: number) {
        this.coordinates[1] = value
    }

    public toJSON(): string {
        return JSON.stringify({latitude: this.latitude, longitude: this.longitude});
    }
}

export class LngLat {

    constructor(public longitude: number, public latitude: number) {

    }
    static instanceOf(object: any): object is LngLat{
        return 'latitude' in object && 'longitude' in object
    }
}

const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: false
    },
    coordinates: {
        type: [Number],
        required: false
    }
},{
    toJSON: {
        transform: (doc, ret, options) => {
            delete ret._id;
            delete ret.type;
            const coordinates = ret.coordinates;
            delete ret.coordinates;
            ret.longitude = coordinates[0];
            ret.latitude = coordinates[1]
        },
    },
    _id : false
});



export const geoPointSchema = {
    type: pointSchema,
    set: (value: any) => {
        if (LngLat.instanceOf(value)) {
            return GeoPointDB.create(value)
        } else if (Array.isArray(value)) {
            return new GeoPointDB(value[0], value [1])
        } else {
            return value;
        }
    }
};

export class GeoPointDB {
    readonly type = "Point";
    coordinates: number[] = [0, 0];

    constructor(longitude: number, latitude: number) {
        this.coordinates = [longitude, latitude];
    }

    static create(lngLat: LngLat){
        return new GeoPointDB(lngLat.longitude,lngLat.latitude);
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
    latitude: number;
    longitude: number;
}

export const  MongooseGeoPoint = {
    type: {
        type: String,
        enum: ['Point'],
        required: false
    },
    coordinates: {
        type: [Number],
        required: false
    }
};
// @ts-ignore
// import distance from 'google-distance-matrix'
import googleMaps, {LatLng} from '@google/maps';

const googleMapsClient = googleMaps.createClient({
    key : "",
    Promise: Promise,

});


export class GoogleMapsUtils {

    static getDirections(origin:LatLng, destination:LatLng ) : Promise<GoogleDirectionsResult> {
       return  googleMapsClient.directions({destination: origin,origin: destination})
            .asPromise()
            .then(res => {
                console.log(res);
                const leg = res.json.routes[0].legs[0];
                const googleDirectionsResult: GoogleDirectionsResult = {
                    distance: leg.distance,
                    duration: leg.duration,
                    startAddress: leg.start_address,
                    endAddress: leg.end_address,
                    // @ts-ignore
                    polylines: leg.steps.map(step => step.polyline.points)
                };
                return googleDirectionsResult;
            })

    }
}

export interface GoogleDistanceOptions {
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit',
    language?: string,
    avoid?: 'tolls' | 'highways' | 'ferries' | 'indoor',
    units?: 'metric' | 'imperial',
    departure_time?: number,
    arrival_time?: number,
    traffic_model?: 'best_guess' | 'pessimistic' | 'optimistic',
}

export interface GoogleDistanceResult {
    "distance": {
        "text": string,
        "value": number
    },
    "duration": {
        "text": string,
        "value": number
    },
    "status": string

}

export interface GoogleDirectionsResult {
    "distance"?: {
        "text": string,
        "value": number
    },
    "duration"?: {
        "text": string,
        "value": number
    },
    startAddress?: string,
    endAddress?: string,
    polylines?:string[]

}

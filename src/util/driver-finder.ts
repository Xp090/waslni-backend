import {Driver, DriverDocument} from "../models/user";
import {SocketEventHandler} from "../socket/SocketEventHandler";
import {RideDriverResponse, RideRequest, RideRequestDocument} from "../models/ride-request";

export class DriverFinder {

    protected config = {
        maxDistance: 500000,
        maxDrivers: 10,
        maxRequestsAtOnce: 5,
        tryNextDriverAfterNumOfFailedRequests: 1
    };
    protected conditions = {
        location: {
            $nearSphere: {
                $geometry: this.handler.user.location,
                $maxDistance: this.config.maxDistance
            }
        }
    };

    protected _foundDriver: DriverDocument = null;
    protected _isCanceled = false;

    protected currentRequests = 0;
    protected failedRequests = 0;
    protected availableDrivers: DriverDocument[];


    protected successCallback: (driver: DriverDocument) => void = null;
    protected errorCallback: (err: any) => void = null;

    protected sentRideRequest: RideRequestDocument = null;

    constructor(protected handler: SocketEventHandler, private _rideRequest: RideRequestDocument) {

    }


    async find(success?: (driver: DriverDocument) => void, error?: (err: any) => void) {
        this.successCallback = success;
        this.errorCallback = error;
        try {
            this.sentRideRequest = await RideRequest.create(this._rideRequest);
            this.availableDrivers = await this.getDrivers();
            this.tryNextDrivers();
        } catch (e) {
            console.error(e);
            this.onFindingFailed("no_driver_found")
        }

    }

    cancel() {
        this._isCanceled = true;
        this.sentRideRequest.requestStatus = RideDriverResponse.RequestCanceledByRider;
        this.sentRideRequest.save();
    }

    protected tryNextDrivers() {
        if (this.currentRequests == 0
            || this.failedRequests >= this.config.tryNextDriverAfterNumOfFailedRequests) {
            const currentDrivers = this.availableDrivers
                .splice(0, this.config.maxRequestsAtOnce - this.currentRequests);
            this.failedRequests = 0;
            if (currentDrivers.length > 0) {
                this.sendRequests(currentDrivers);
            } else {
                this.onFindingFailed("no_driver_found")
            }

        }
    }

    protected async getDrivers(): Promise<DriverDocument[]> {
        return Driver.find(this.conditions)
            .limit(this.config.maxDrivers)
    }

    protected sendRequests(drivers: DriverDocument[]) {
        for (const driver of drivers) {
            if (this.isDriverFound || this.isCanceled) {
                break
            }
            this.currentRequests++;
            this.updateSentRequestStatus(driver);
            this.handler.sendTripRequestToDriver(driver.socketId).emitThenListenOnce(this.sentRideRequest)
                .subscribe(didAccept => {
                    if (didAccept) {
                        this.onDriverAccepted(driver)
                    } else {
                        this.onDriverDeclined(driver)
                    }
                }, err => {
                    this.onDriverTimeout(driver)
                })
        }
    }

    protected onDriverAccepted(driver: DriverDocument) {
        if (!this.isDriverFound && !this.isCanceled) {
            this._foundDriver = driver;
            this.currentRequests--;
            this.updateSentRequestStatus(driver,RideDriverResponse.RequestAcceptedByDriver);
            this.onFindingDone(driver)
        } else {
            this.updateSentRequestStatus(driver,
                this.isCanceled ? RideDriverResponse.RequestCanceledByRider : RideDriverResponse.RequestTimedOut);
        }

    }

    protected onDriverDeclined(driver: DriverDocument) {
        this.failedRequests++;
        this.currentRequests--;
        this.updateSentRequestStatus(driver,RideDriverResponse.RequestDeclinedByDriver);
        this.tryNextDrivers();
    }

    protected onDriverTimeout(driver: DriverDocument) {
        this.failedRequests++;
        this.currentRequests--;
        this.updateSentRequestStatus(driver,RideDriverResponse.RequestTimedOut);
        this.tryNextDrivers();
    }

    protected onFindingDone(acceptedDriver: DriverDocument) {
        this.sentRideRequest.requestStatus = RideDriverResponse.RequestAcceptedByDriver;
        this.sentRideRequest.acceptedDriver = acceptedDriver;
        this.sentRideRequest.save();
        this.successCallback?.(acceptedDriver)
    }

    protected onFindingFailed(err: any) {
        if (!this.isDriverFound || !this.isCanceled) {
            this.sentRideRequest.requestStatus = RideDriverResponse.RequestTimedOut;
            this.sentRideRequest.save();
            this.errorCallback?.(err);
        }
    }

    private updateSentRequestStatus(driver: DriverDocument, response?: RideDriverResponse) {
        const sentRequest = this.sentRideRequest.requestsSent.get(driver.id) || {
            driver: driver,
        };
        if (response) {
            sentRequest.response = response;
            sentRequest.responseDate = new Date();
        }
        this.sentRideRequest.requestsSent.set(driver.id, sentRequest);
        this.sentRideRequest.save();
    }

    get isDriverFound() {
        return !!this.foundDriver;
    }

    get foundDriver() {
        return this._foundDriver;
    }

    get isCanceled() {
        return this._isCanceled
    }
}
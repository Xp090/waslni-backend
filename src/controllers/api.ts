"use strict";
import passport from "passport";
import {  UserDocument,  } from "../models/user";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { check, sanitize, validationResult } from "express-validator";
import "../config/passport";
import jwt from "jsonwebtoken";
import {SESSION_SECRET} from "../util/secrets";
import {GoogleMapsUtils} from "../util/google-maps-utils";
import {TripEconomy} from "../models/trip";

export const postLoginApi = (req: Request, res: Response, next: NextFunction) => {
    check("email", "Email is not valid").isEmail();
    check("password", "Password cannot be blank").isLength({min: 1});
    // eslint-disable-next-line @typescript-eslint/camelcase
    sanitize("email").normalizeEmail({ gmail_remove_dots: false });

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.flash("errors", errors.array());
        return res.redirect("/login");
    }

    passport.authenticate("local", (err: Error, user: UserDocument, info: IVerifyOptions) => {
        if (err) { return next(err); }
        if (!user) {
            return res.status(400).send( "INVALID_CREDENTIALS" )
        }
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            const body = { _id : user._id, email : user.email };
            const token = jwt.sign({ user : body },SESSION_SECRET);
            res.json({ token , user });
            next();
        });
    })(req, res, next);
};

export const getUserApi = (req: Request, res: Response, next: NextFunction) => {
    res.json( req.user );
    next();
};


export const getTripCost = (req: Request, res: Response, next: NextFunction) => {
    const {origin, destination} = req.query;
    GoogleMapsUtils.getDirections(origin,destination)
        .then(result =>{
            const cost:TripEconomy = {cost: result.distance.value * 0.025} ;
            res.send({
                tripDirections: result,
                tripEconomy: cost
            } );
            next();
        });

};
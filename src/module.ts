import * as dotenv from 'dotenv';
dotenv.config();

import {Application} from 'express'
import cors from 'cors';
import { json, urlencoded } from 'body-parser';
import express from 'express'
import cookieSession from 'cookie-session'; 
import mongoose from 'mongoose'
import { authRouters } from './auth/auth.routers'
import { sellerRouters } from './seller/seller.routers'

import { errorHandler, currentUser } from '@shoppingappkec/common';

// import { sellerRouters } from './seller/seller.routers'

export class AppModule {
    constructor(public app: Application) {
        app.set('trust-proxy', true);
        // mongoose.set("strictQuery", false);
        // app.set('trust-proxy', true)

        app.use((cors)({
            origin: "*",
            credentials: true,
            optionsSuccessStatus: 200
        }));

        app.use(express.urlencoded({ extended: false }));
        app.use(express.json())
        app.use(cookieSession({
            signed: false,
            secure: false
        }));

        Object.setPrototypeOf(this, AppModule.prototype)
    }

 
    async start() {
            if (!process.env.MONGO_URI) {
                throw new Error('mongo_uri must be defined');
            }
            if (!process.env.JWT_KEY) {
                throw new Error('mongo_uri must be defined');
            }
            if(!process.env.STRIPE_KEY) {
                throw new Error('STRIPE_KEY must be defined');
            }
            try {
                // console.log(process.env.MONGO_URI)
                await mongoose.connect(process.env.MONGO_URI);
            } catch (err) {
                throw new Error('database connection error');
            }

            // We use the middleware here inside app module so that all the routers will get the current user
            // We can make sure that we are actually getting the JWT key from the env file
            this.app.use(currentUser(process.env.JWT_KEY!))
            this.app.use(authRouters)
            this.app.use(sellerRouters)
            // errorHandler - NPM middleware 
            this.app.use(errorHandler)

            this.app.use(currentUser(process.env.JWT_KEY!))
            
            // app.use(errorHandler)

            const PORT = process.env.PORT || 8080
            this.app.listen(8080, () => console.log('OK! port: 8080'));
        };
        
}
// exports.AppModule = AppModule;

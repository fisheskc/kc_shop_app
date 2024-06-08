import { AppModule } from './module'
import express from 'express'
// import { Request } from 'express';
import { JwtPayload } from '@shoppingappkec/common';

declare global {
    namespace Express {
        interface Request {
            currentUser?: JwtPayload
        }
    }
}

const bootstrap = () => {
    const app  = new AppModule(express())

    app.start()
}

bootstrap()

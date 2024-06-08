import { Router, Request, Response, NextFunction } from 'express'
import { authService } from './auth.service';
import { currentUser, BadRequestError } from '@shoppingappkec/common';

const router = Router();

router.post('/signup', async(req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const result = await authService.signup({ email, password });

    if(result.message) return next(new BadRequestError(result.message))
    
    req.session = { jwt: result.jwt };
    // 201 for a created status, for a new user, status true
    res.status(201).send(true);
})
// If there is any errors in the auth.service, it will send the error to the error handler that exists 
// inside our app module. Error handler exists inside our NPM package: shopping app - errorHandler
router.post('/signin', async (req: Request, res: Response, next: NextFunction) => { 
    const { email, password } = req.body;
    const result = await authService.signin({ email, password });

    if(result.message) return next(new BadRequestError(result.message))
    // returns a JWT token
    // req.session = { jwt: result.jwt }
    req.session = { jwt: result.jwt }
    res.status(201).send(true);
})

// We pass the GTP token or a key from the .env file into this function
router.get('/current-user', currentUser(process.env.JWT_KEY!), async (req: Request, res: Response, next: NextFunction) => { 
    res.status(200).send(req.currentUser)
})

export { router as authRouters }
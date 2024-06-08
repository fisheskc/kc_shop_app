import { UserService,  userService } from './user/user.service';
import { AuthDto } from './dtos/auth.dto'
import { NextFunction } from 'express';
import { BadRequestError,  AuthenticationService} from '@shoppingappkec/common'


// when saving user into the DB, the password for that user has been hashed

export class AuthService {
    constructor (
        public userService: UserService,
        // We will use the authentication Service inside oath service as an instance & 
        // of type authentication
        public authenticationService: AuthenticationService
    ) {}
       async signup(createUserDto: AuthDto)  {
            const existingUser = await this.userService.findOneByEmail(createUserDto.email)
            if(existingUser) return { message: 'email is taken'};
            // if(existingUser) return errCallback(new BadRequestError('email is taken'));

            const newUser = await this.userService.create(createUserDto);
            // We get a new user & then we generate a JWT token & return it to the routers.
            const jwt = this.authenticationService.generateJwt({ email: createUserDto.email, userId: newUser.id}, process.env.JWT_KEY!);
            // We send back an object containing the JWT, so inside the auth routers, we can get the JWT from the result dot JWT
            // return jwt;
            return {jwt};
           
    }

    async signin(signinDto: AuthDto) {
        const user = await this.userService.findOneByEmail(signinDto.email);
        if(!user) return { message: 'Wrong credentials'};
        
        // if(!user) return errCallback(new BadRequestError('Wrong credentials'));

        const samePwd = this.authenticationService.pwdCompare(user.password,signinDto.password);
        if(!samePwd) return { message: 'Wrong credentials'};
        // if(!samePwd) return errCallback(new BadRequestError('Wrong credentials'));
        // With the authentication Service, we can now generate a JWT token. To do this we use the authentication Service instance and we 
        // the JWT to generate a JWT method
        // payload from the user.email & payload contains the email. The user ID from the newly created user
        // We need the JWT key & we can get that from process.env.jwt key 
        const jwt = this.authenticationService.generateJwt({ email: user.email, userId: user.id}, process.env.JWT_KEY!);

        return {jwt};
        // return jwt;
    }

}

export const authService = new AuthService(userService, new AuthenticationService())
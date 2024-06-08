import mongoose from 'mongoose';
// AuthenticationService - from the shopping app, because the JWT to hash method is from that class.
import { UserModel, UserDoc, AuthenticationService } from '@shoppingappkec/common';

const schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,   
    },
    password: {
        type: String,
        required: true, 
    }
}, {
   toJSON: {
    // We do not want to send the password to the client.
        transform(doc, ret) {
            ret.id = ret._id
            delete ret._id
            delete ret.password
        }
   }
})

// means that before saving/ Initiate the authentification service from the kcshopapp
// We use the JWT to Hash method from that class
schema.pre('save', async function(done){
    const authentificationService = new AuthenticationService()
    // Check if the password is modified or if this document is a new document is new
    // this.isModified('password') - this keyword refers to the schema or to the newly created document
    // If the password is updated or we have a new document added to the DB, we will create a hash password & 
    // update the password field inside the new document.
    if(this.isModified('password') || this.isNew) {
        const hashedPwd = authentificationService.pwdToHash(this.get('password'))
        // We change the password to our hashed password
        this.set('password', hashedPwd);
    }

    done()
})
// This instance of this class
export const User = mongoose.model<UserDoc, UserModel>('User', schema)
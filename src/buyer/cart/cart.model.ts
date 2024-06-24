import mongoose from 'mongoose'
import { CartDoc, CartModel } from '@shoppingappkec/common';

const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CartProduct"
        }
    ],
    // For the total price, we need to add the default value, otherwise we will get the total price as null
    // & also errors when making calculations with the total price.
    // then we have to 
    totalPrice: { type: Number, default: 0, required: true }

    customer_id: { type: String }
})

export const Cart = mongoose.model<CartDoc, CartModel>('Cart', schema);
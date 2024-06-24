import mongoose from 'mongoose'
import { CartProductDoc, CartProductModel } from '@shoppingappkec/common'

const schema = new mongoose.Schema({
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart',
        require: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        require: true
    },
    quantity: { type: Number, required: true}
})

export const CartProduct = mongoose.model<CartProductDoc, CartProductModel>('CartProduct', schema)
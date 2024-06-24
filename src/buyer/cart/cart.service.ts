import { CartModel, CartProductModel, ProductDoc } from "@shoppingappkec/common";
import { CartProduct } from './cart-product.model';
import { Cart } from "./cart.model";
import { AddProductToCartDto, CreateCartProductDto, RemoveProductFromCartDto, UpdateCartProductQuantityDto } from "../dtos/cart.dto"


export class CartService {
    constructor(
        public cartModel: CartModel,
        public cartProductModel: CartProductModel
    ) {}
    // If a user decides to add a product to the cart, we are going to check if it is a
    // registered cart in the DB. If we do not, then we will create a cart for them.
    // If we have a cart, then we will either add the product or increase the quantity if that
    // product already exists
    async findOneByUserId(userId: string) {
        return await this.cartModel.findOne({ user: userId })
    }
    // We will get the correct cart productId of type string 
    async getCartProductById(productId: string, cartId: string) {
        // We will findOne the cartProductId
        // We will look for a cart product with the productId & we need the cartId to get the exact 
        // correct product
        return await this.cartProductModel.findOne({ product: productId, cart: cartId })
    }

    // For the create cart, we only need the user id
    async createCart(userId: string) {
        const cart = new this.cartModel({
            user: userId
        })
        // For the other properties inside the cart model, we will get an empty array, for the products.
        
        return await cart.save()
    }

    async createCartProduct(createCartProductDto: CreateCartProductDto) {
        // creates an instance of cartProductModel
        const cartProduct = new this.cartProductModel({
            cart: createCartProductDto.cartId,
            product: createCartProductDto.productId,
            quantity: createCartProductDto.quantity
        })

        return await cartProduct.save()
    }

    async getCart(cartId: string) {
        return await this.cartModel.findOne({ _id: cartId })
    }
    
    async clearCart(userId: string, cartId: string) {
        // We send back a new object
        return await this.cartModel.findOneAndUpdate({ _id: cartId, user: userId }, { $set: { products: [], totalPrice: 0 }}, { new: true })
    }

        // If we have a cart, we will check if the product exists inside that cart or if does not exist.
        // If the product exits inside the cart, we will update this & it's quantity
    async isProductInCart(cartId: string, productId: string) {
        // It will first search for the card product model
        // To return a boolean, we will put parenteses around - (this.cartProductModel.findOne({ cartId, product: productId }))
        // The first exclamation mark is going to return a true, because we have a null
        // The second exclamation mark is going to change the true to a false.
        // If we get a false, it means that the product does not exist inside the cart, because from the beginning
        // we got a null
        return !!(await this.cartProductModel.findOne({ cartId, product: productId }))
    }
    async removeProductFromCart(removeProductFromCartDto: RemoveProductFromCartDto) {
        const { cartId, productId } = removeProductFromCartDto;
        // Search for the cart product with the product Id
        const cartProduct = await this.cartProductModel.findOne({ product: productId}).populate('product')
        // When we get a null inside the buyerService, we will return an instance of a customer
        // Here we only have to return null if there is an error
        if(!cartProduct) return null;
        // Delete the product or the cart product
        const deletedDoc = await this.cartProductModel.findOneAndRemove({ _id: cartProduct._id });
        // If you did not get the deleted object, we will return null
        if(!deletedDoc) return null;
        // if we have the deleted object, we need to update the cart & we will update the total price
        // Pull out from the products the cart product.id
        // We will remove the product cart from the product array
        // Here we will pull out & use the pull query. Increment or decrement the total price, using the increment query
        return await this.cartModel.findOneAndUpdate({ _id: cartId},
            { $pull: { products: cartProduct._id },
            $inc: { totalPrice: - (cartProduct.product.price * cartProduct.quantity) } }, { new: true})
    }


    // We need the options argument which is of type object, that includes an increment property of type boolean
    async updateProductQuantity(updateCartProductQuantityDto: UpdateCartProductQuantityDto) {
        const { inc, amount } = updateCartProductQuantityDto.options;
        const { productId, cartId } = updateCartProductQuantityDto;
        // We have to fetch the correct product object
        const cartProduct = await this.cartProductModel.findOne({ product: productId })
        // checking if product exist in cart, if yes, we have cart product
        // updateProductQuantity method will be used in different routers where we not use the add product
        // method & we will not check or have a pre-check for the cart product. If no cart product, we return null
        if(!cartProduct) return null
        // Check the cartProduct.quantity is less than the amount, decrease the quantity of a product
        if(cartProduct.quantity < amount && !inc) {
            // remove product
            // We get the product id from the updateProductQuantity method arguments
            return await this.removeProductFromCart({ cartId, productId })
        }
        // if case where the amount is less than the quanity
        // Update the product cartProduct
        // We will look for the productModel, for a product with an ID from the productId
        // We will use the increment query to increment the quantity by either the amount ot the minus amount
        const updatedCartProduct = await this.cartProductModel.findOneAndUpdate({ _id: cartProduct._id},
            { $inc: { quantity: inc ? amount : - amount } }, { new: true }).populate('product')
            // We will check if we have the increment option is set to true or false
            // If true, we update the cartProduct
            // const newPrice = inc ? updatedCartProduct! - we add an exclamation mark because we are not sure if 
            // we will get or typescript is not sure if we will update the cardProduct or not
            // If imcrement amount is set to false, we will return a minus updatedcart object or the product.price * amount
        const newPrice = inc ? updatedCartProduct!.product.price * amount
                            : - (updatedCartProduct!.product.price * amount)

        return await this.cartModel.findOneAndUpdate({ _id: cartId }, 
           { $inc: { totalPrice: newPrice }}, {new: true })
    }

    // The product is going to be of type productDoc
    async addProduct(addProductToCartDto: AddProductToCartDto, product:ProductDoc) {
        // We extract the 3 properties: the userId, quantity, productId from the addProductToCartDto
        const { userId, quantity, productId } = addProductToCartDto
        // if the product exists in the cart & if so, we will update the quantity of the cart product
        // quantity to be increased by 1 
        // We will check if product is in the cart
        let cart = await this.findOneByUserId(userId)

        // We create the product here. We give it the cartId only if we have the cart
        const isProductInCart = cart && await this.isProductInCart(cart._id, productId)
        // if the product already exists, product is in cart, if not, isProductInCart will return null
        // if product exists in cart, increase the quantity 
        if(isProductInCart && cart) return this.updateProductQuantity({cartId: cart._id, productId, options: { inc: true, amount: quantity }})

        // check if we do not have a cart & if not we will create one
        if(!cart) cart = await this.createCart(userId)
        // We create a product document & then we will add it to the cart
        // After creating the cart project, we need to add the cartProduct to the cart
        const cartProduct = await this.createCartProduct({ cartId: cart._id, productId, quantity })
        return await this.cartModel.findOneAndUpdate({ _id: cart._id },
            { $push: { products: cartProduct }, $inc: { totalPrice: product.price * quantity }}, { new: true })

    } 

}  

export const cartService = new CartService(Cart, CartProduct)
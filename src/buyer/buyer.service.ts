// We import an instance of the cartService, so that we can create the service or the instance of the BuyerService
// Everytime the seller adds a product, we are going to add that product inside the buyerService
// Here we can access the code because we are using a monolithic application
import { CartService, cartService } from './cart/cart.service';
import { ProductService, productService } from '../seller/product/product.service'
import { AddProductToCartDto, UpdateCartProductQuantityDto, RemoveProductFromCartDto } from './dtos/cart.dto';
import { BadRequestError, NotAuthorizedError } from '@shoppingappkec/common';
import { OrderService, orderService } from './order/order.service'
import Stripe from 'stripe'
// Here we will accept the buyer or the cart service
export class BuyerService {
    constructor(
        // CartService is a class & we can use classes as types
        public cartService: CartService,
        public productService: ProductService,
        public orderService: OrderService,
        public stripeService: Stripe
    ) {}
    
    async addProductToCart(addProductToCartDto: AddProductToCartDto) {
        /// Check if we have a cart product or a product with the same ID
        // We search for the product & make sure we are adding a real product, to the product, to the cart. 
        // We need to check if the product already exists 
        const product = await this.productService.getOneById(addProductToCartDto.productId)
        // We check if we do not have the product or do not find the product
        // We return a new instance of the badRequestError
        if(!product) return new BadRequestError('product not found!')
        // If we have the product, then we can return 
        const cart =  await this.cartService.addProduct(addProductToCartDto, product)
        // If we do not have the cart, we will return an instance of a new error
        if(!cart) return new Error ('could not update the cart')
        return cart;
        
    }

    async updateCartProductQuantity(updateCartProductQuantityDto: UpdateCartProductQuantityDto) {
        // We need to check if we have the correct product inside the DB
        // Extract from cart. We are expecting to get the productId of the actual product, not for the 
        // card productId
        // We are using the productId as the real identifier of the real product inside all the methods
        // We need to extract the cart Id
        const { productId, cartId} = updateCartProductQuantityDto
        // We use cartService & we will look for the cart product
        const cartProduct = await this.cartService.getCartProductById( productId, cartId)
        // We will check for a productId or if we do not have a productId, cart product object, the cartId
        if(!cartProduct) return new BadRequestError('product not found in cart')
        // We update the updateProdcutQuantity method
        const cart = await this.cartService.updateProductQuantity(updateCartProductQuantityDto)   
        // If we do not have the cart, we will return an instance of a new error
        if(!cart) return new Error ('could not update the cart')
        return cart; 
    }

    async removeProductFromCart(removeProductFromCartDto: RemoveProductFromCartDto) {
        const { productId, cartId} = removeProductFromCartDto;
        // We use cartService & we will look for the cart product
        const cartProduct = await this.cartService.getCartProductById( productId, cartId)
        // We will check for a productId or if we do not have a productId, cart product object, the cartId
        if(!cartProduct) return new BadRequestError('product not found in cart')
        const cart = await this.cartService.removeProductFromCart(removeProductFromCartDto)
        // If we do not have the cart, we will return an instance of a new error
        if(!cart) return new Error ('could not update the cart')
        return cart; 
    }

      // We need to check the cart belongs to the user who made the request
      async getCart(cartId: string, userId: string) {
        const cart = await this.cartService.getCart(cartId)
        // We will check if we do not have a cart & will return a new badRequest
        if(!cart) return new BadRequestError('cart not found')
        // If we have a cart, we will check if the user equals to the userId
        // The userId is of type objectId, so we have to use the toString method to change it to a normal string
        if(cart.user.toString() !== userId) return new NotAuthorizedError()

        return cart;     
    }
    // We need to search for the cart with the userId & check if the user has a cart with some products.
    // It is the first time for the user to make a payment, we register their customer Id inside the cart object
    // Everytime we check if the user has a customer Id or not in the DB.
    // If they have one, we will proceed with the charge
    // If the customer does not have a customer Id, then they are a new customer
    async checkout(userId: string, cardToken: string, userEmail: string) {
        const cart = await this.cartService.findOneByUserId(userId)
        // We check if we did not get the cart
        if(!cart) return new BadRequestError('your cart is empty!');
        if(cart.products.length === 0) return new BadRequestError('your cart is empty!');
        let customer_id: string

        // We check if the user is already a registered customer
        if(cart.customer_id) {
        // If we have a customerId, we should not create the new customer
        // We should assign the card customerId to the customerID variable
            customer_id = cart.customer_id
        } else {
            // We will create the customer & get the ID
            // We create an object to extract the ID from the customer 
            const { id } = await this.stripeService.customers.create({
            email: userEmail,
            source: cardToken
         })
         
         // We will give the customerId  to the newly created ID
         customer_id = id;
         // We need to save the customer_Id inside the cart
         await cart.set({ customer_id }).save()
        }
         // We will check if we do not get any errors while extracting the customerId
         if(!customer_id) return new BadRequestError('invalid data')
         // If we have the ID, we will create the charge
         // We will charge the user for the total price of the cart
         const charge = await this.stripeService.charges.create({
            amount: cart.totalPrice * 100,
            currency: 'usd',
            customer: customer_id
         })

         if(!charge) return new BadRequestError('invalid data! could not create the charge!')
         
         // A customer has made a payment before & has an account inside our stripe API 
         // we create another customer, with the same email & we can get an error from stripe
         // We want to have one customer, with one email, every time we make a payment
         // When we create the carts, we will create a new order
         await this.orderService.CreateOrder({ 
            userId,
            // We only need to multiple by 100, if we are using stripe.
            totalAmount: cart.totalPrice,
            chargeId: charge.id

         })
         // clear the cart, because we purchased the products
         // We need the userId & we get this from cartService
         await this.cartService.clearCart(userId, cart._id)

         return charge
    }

    async updateCustomerStripeCard(userId: string, newCardToken: string) {
        const cart = await this.cartService.findOneByUserId(userId)
        // We check if we did not get the cart
        if(!cart) return new BadRequestError('your cart is empty!');
        // If we do not have this, we will send back an error & tell the client that he is not a customer
        if(!cart.customer_id) return new BadRequestError('you\'re a customer!');
        // We use the stripe service to update the card & we update the object properties
        try {
            await this.stripeService.customers.update(cart.customer_id, {
                source: newCardToken })
        } catch(err) {
            return new Error('card update failed')
        }
        
     
        return true
    }
}
// We give BuyerService the instance of cartService
// We use the instance of the productService & we will use the method from the productService to search
// We create a new stripe instance with the stripe key
export const buyerService = new BuyerService(
    cartService,
    productService, 
    orderService, 
    new Stripe(process.env.STRIPE_KEY!, { apiVersion: '2024-04-10'}))
import { OrderModel } from '@shoppingappkec/common'
import { Order } from './order.model'
import { CreateOrderDto } from '../dtos/order.dto'

export class OrderService {
    constructor(
        public orderModel:  OrderModel
    ) {}

    async CreateOrder(createOrderDto: CreateOrderDto) {
        const order = await this.OrderModel({
            // We create a new instance of the orderModel with the user
            user: createOrderDto.userId,
            totalAmount: createOrderDto.totalAmount,
            chargeId: createOrderDto.chargeId
        })
        return await order.save()
    }
}

// We export a new instance of the orderService
export const orderService = new OrderService(Order)

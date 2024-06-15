import { ProductModel, uploadDir } from '@shoppingappkec/common'
import { Product } from "./product.model";
import { CreateProductDto, UpdateProductDto, DeleteProductDto, AddImagesDto, DeleteImagesDto } from '../dtos/product.dto';
import fs from 'fs'
import path from 'path'

export class ProductService {
    // the constructor will a product model
    constructor(public productModel: ProductModel) {}

    // 
    async getOneById(productId: string) {
        return await this.productModel.findById(productId)
    }

    // create will accept a create product detail
    async create(createProductDto: CreateProductDto) {
        const images = this.generateProductImages(createProductDto.files)
        const product = new this.productModel({
            title: createProductDto.title,
            price: createProductDto.price,
            user: createProductDto.userId,
            // The source property will be of type string & this will be generated automatically
            // from the generateProductImages method
            images: images
        })
        return await product.save()
    }
    
    async updateProduct(updateProductDto: UpdateProductDto) {
        // We look for a specific product  with an Id
        return await this.productModel.findOneAndUpdate({ _id: updateProductDto.productId},
        // We have productId & we have the set query. We will update the title with the updateProductDto.title & price
        // We will send or return the new updated object
        { $set: { title: updateProductDto.title,  price: updateProductDto.price }}, { new: true })
    }

    // We will use the product model to simply delete the specific product from the DB.
    // We will search for the product id, 
    async deleteProduct(deleteProductDto: DeleteProductDto) {
        return await this.productModel.findOneAndRemove({ _id: deleteProductDto.productId })
    }
    // We can add images only when we create a product, but the user should add/delete the images even after 
    // creating a product
    async addImages(addImagesDto: AddImagesDto) {
        const images = this.generateProductImages(addImagesDto.files)
        // We are going to find a product with the Id & we can get the Id from the OD addImagesDto.productId
        // we then update the images field
        // We are going to only add images without deleting the existing images
        // we can push the new array to the existing array (images array) & send back a new version of the object
        // The $each query is going to spread the images array inside the existing images array in the DB
        return await this.productModel.findOneAndUpdate({ _id: addImagesDto.productId}, { $push: { images: { $each: images}}}, { new: true })
    }

    async deleteImages(deleteImagesDto: DeleteImagesDto) {
        // We will pull images from the images property inside the DB & we will for any product with the id, that exists inside the images (deleteImagesDto) array
        // We send a new version or a new updated object
        return await this.productModel.findOneAndUpdate({ _id: deleteImagesDto.productId}, { $pull: { images: { _id: { $in: deleteImagesDto.imagesIds }}} }, { new: true })
    }

    generateBase64Url(contentType: string, buffer: Buffer) {
        // If we use this URL in the front end, we will get the image rendered inside the browser.
        return `data:${contentType};base64,${buffer.toString('base64')}`
    }

   // You get the type of the files. We will return an array of objects containing the source property
   // The source property is of type string 
   generateProductImages(files: CreateProductDto['files']): Array<{ src: string }> {
        let images: Array<Express.Multer.File>
        if(typeof files === "object") {
            // If we have any nested like arrays inside the files, we will use the flat method.
            images = Object.values(files).flat()
        } else {
        // If we do not have an object, we can have an array or undefined
        // We will check if we have files, then we will spread the files in an array
        // We will do this because, we might get a Typescript error, when we try to use the files argument directly as an array
        images = files ? [...files] : []
        }

        // Loop through the Multer files
        return images.map((file: Express.Multer.File) => {
            // We need the content type from the file.content tFS package or methodype or a mimetype
            // We have to generate the buffer ourselves & we will use the fs & then the read file sync method.
            // You refer to the path of the file, the upload with the file name & this will return a buffer
            // We will use this buffer inside the generate base64URL method, otherwise you will get an error 
            // when using the file.buffer property
            let srcObj = { src: this.generateBase64Url(file.mimetype, fs.readFileSync(path.join(uploadDir + file.filename))) }
            // here we add a callback - () & keep it empty, because it is required here & will return
            // a source object - srcObj
            fs.unlink(path.join(uploadDir + file.filename), () => {})
            return srcObj
        })
    }
}
// This is an instance of the class ProductService with the product model
export const productService = new ProductService(Product)
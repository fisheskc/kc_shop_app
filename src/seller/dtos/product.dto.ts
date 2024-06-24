import { Request } from 'express'

export interface CreateProductDto {
    title: string;
    price: number;
    userId: string;
    // files is of type Request & we import that from express
    // The Request we will get the files property from it
    // The files property is of type melter.file & will be an array of files
    files: Request['files']
}

export interface UpdateProductDto {
    userId: string;
    title: string;
    price: number;
    productId: string;
}

// To delete a product we only need the product id.
// We will only need the product id of the type string.
export interface DeleteProductDto {
    productId: string;
    userId: string;
}

export interface AddImagesDto {
    // here we accept a user id
    userId: string;
    productId: string;
    // The files property is of type melter.file & will be an array of files
    files: Request['files']
}

export interface DeleteImagesDto {
      // here we accept a user id
      userId: string;
      productId: string;
      imagesIds: Array<string>;
}
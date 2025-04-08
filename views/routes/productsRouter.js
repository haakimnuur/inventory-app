const { Router } = require('express');
const { getProducts, getProductDetails, getProductForm, addNewProduct, editProduct, deleteProduct } = require('../controllers/productsController');

// Import Cloudinary and upload settings
const { upload } = require('../cloudinaryConfig');

const productsRouter = Router();

productsRouter.get('/', getProducts)
productsRouter.get('/new', getProductForm)
productsRouter.get('/:id', getProductDetails);
productsRouter.get('/:id/edit', getProductForm);

productsRouter.post('/new', upload.single('image'), addNewProduct);
productsRouter.post('/:id/edit', upload.single('image'), editProduct);
productsRouter.post('/:id/delete', deleteProduct);

module.exports = productsRouter;
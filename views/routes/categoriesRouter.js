const { Router } = require('express');
const { getCategories, getCategoryDetails, getCategoryForm, addNewCategory, editCategory, deleteCategory } = require('../controllers/categoriesController');

const categoriesRouter = Router();

categoriesRouter.get('/', getCategories);
categoriesRouter.get('/create', getCategoryForm)
categoriesRouter.get('/:id', getCategoryDetails);
categoriesRouter.get('/:id/edit', getCategoryForm)

categoriesRouter.post('/create', addNewCategory);
categoriesRouter.post('/:id/edit', editCategory);
categoriesRouter.post('/:id/delete', deleteCategory);

module.exports = categoriesRouter;
const { getAllTopCategories, getAllSubCategories, getCategoryById, getSubCategoriesById, getProductsByCategoryId, insertCategory, updateCategory, deleteCategoryById } = require("../db/queries")

const getCategories = async (req, res) => {
  try {
    const [topCategories, subCategories] = await Promise.all([
      getAllTopCategories(),
      getAllSubCategories()
    ]);

    // Group subcategories by parent_category_id for quick lookup
    const subCategoryMap = {};
    subCategories.forEach(subCategory => {
      if (!subCategoryMap[subCategory.parent_category_id]) {
        subCategoryMap[subCategory.parent_category_id] = [];
      }
      subCategoryMap[subCategory.parent_category_id].push(subCategory);
    });

    console.log('Top categories: ', topCategories);
    console.log('Sub categories: ', subCategories);

    res.render('categories', { topCategories, subCategoryMap });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Server Error');
  }
};

const getCategoryDetails = async(req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await getCategoryById(categoryId);
    let parentCategory, subCategories, categoryProducts;
    if (!category) {
      return res.status(404).send("Category not found");
    }
    const categoryParentId = category.parent_category_id;
    
    if (categoryId == 1) {
      // If category is miscellaneous
      categoryProducts = await getProductsByCategoryId(categoryId);

      res.render('categoryDetails', { category, subCategories, categoryProducts})
    } else if (categoryParentId) {
      // If it's subcategory
      [parentCategory, categoryProducts] = await Promise.all([
        getCategoryById(categoryParentId),
        getProductsByCategoryId(categoryId)
      ])
      res.render('categoryDetails', { category, subCategories, parentCategory, categoryProducts })
      return;
    } else {
      // Else if it's parent category
      subCategories = await getSubCategoriesById(categoryId);
      console.log(subCategories)
      res.render('categoryDetails', { category, subCategories, categoryProducts })
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error: ", err);
  }
}

const getCategoryForm = async (req, res) => {
  try {
    const categoryId = req.params.id;
    let category, isEditing;

    const parentCategories = await getAllTopCategories();

    if (categoryId && Number.isInteger(Number(categoryId))) {
      category = await getCategoryById(categoryId);

      if (!category) {
        return res.status(404).send("Category not found");
      }

      isEditing = true;
    }

    res.render('categoryForm', { category, parentCategories, isEditing});
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const addNewCategory = async(req, res) => {
  try {
    const { category, description, category_type, parent_category_id } = req.body;

    // Determine parent_category_id: If it's a parent category, set it to NULL
    const parentId = category_type === "parent" ? null : parent_category_id || null;

    // Insert category into the database
    const result = await insertCategory(category, description, parentId);

    if (!result) {
      throw new Error("Failed to insert new category");
    }

    // Redirect to categories list or show success message
    res.redirect('/categories');
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).send("Server Error");
  }
}

const editCategory = async (req, res) => {
  try {
    const { category, description } = req.body;
    const categoryId = req.params.id;
    console.log("category", category);
    console.log(description);

    const result = await updateCategory(categoryId, category, description);

    if (!result) {
      throw new Error("Failed to update category");
    }

    res.redirect('/categories');
  } catch (err) {
    console.error("Error updating category:", err);

    // If the error is about a default category, return a custom message
    if (err.message === 'This category cannot be edited as it is a default item.') {
      return res.status(400).send(err.message);
    }

    // If it's a different error, return a general error message
    res.status(500).send("Server Error");
  }
};

const deleteCategory = async (req, res) => {
  const categoryId = req.params.id;
  
  try {
    await deleteCategoryById(categoryId);
    res.redirect('/categories');
  } catch (err) {
    console.error(err);

    // If the error is about a default category, return a custom message
    if (err.message === 'This category cannot be deleted as it is a default item.') {
      return res.status(400).send(err.message);
    }

    // If it's a different error, return a general error message
    res.status(500).send("Error deleting category");
  }
};

module.exports = {
  getCategories,
  getCategoryDetails,
  getCategoryForm,
  addNewCategory,
  editCategory,
  deleteCategory
}
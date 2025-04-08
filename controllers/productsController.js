const { getallInventory, getProductById, getAllSubCategories, getAllTopCategories, insertProduct, updateProduct, deleteProductById } = require("../db/queries")
const path = require('path');
const fs = require('fs');
const { cloudinary } = require('../cloudinaryConfig')

const getProducts = async(req, res) => {
  try {
    const products = await getallInventory();

    res.render('products', { products })
  } catch (err) {
    console.error('Error fetching Products:', err);
    res.status(500).send('Server Error');
  }
}

const getProductDetails = async(req, res) => {
  try {
    const productId = req.params.id;
    console.log(productId)
    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render('productDetails', { product });
  } catch(err) {
    console.log(err);
    res.status(500).send("Server Error: ", err);
  }
}

const getProductForm = async(req, res) => {
  try {
    const productId = req.params.id;
    let product;

    const [parentCategories, subCategories] = await Promise.all([
      getAllTopCategories(),
      getAllSubCategories()
    ]);

    if (productId && Number.isInteger(Number(productId))) {
      product = await getProductById(productId);

      if (!product) {
        return res.status(404).send("Category not found");
      }
    }

    console.log(parentCategories)

    res.render('productForm', { product, subCategories, parentCategories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
}

const addNewProduct = async(req, res) => {
  try {
    const { name, description, price, quantity, category_id } = req.body;

    // Validate required fields
    if (!name || !price || !quantity || !category_id) {
      return res.status(400).send("All fields are required.");
    }

    // Check if price and quantity are valid numbers
    if (isNaN(price) || isNaN(quantity)) {
      return res.status(400).send("Price and quantity must be valid numbers.");
    }

    let image = null;
    // Proceed with image upload only if validation passes
    if (req.file) {
      image = req.file.path; // Get the image URL from Cloudinary (or local path)
    }

    const result = await insertProduct(name, description, quantity, price, category_id, image);

    if (!result)  {
      throw new Error("Failed to insert new product");
    }

    res.redirect('/products');
  } catch(err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
}

const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const oldProduct = await getProductById(productId);

    if (!oldProduct) return res.status(404).send("Product not found");

    // Validate required fields
    const { name, description, price, quantity, category_id } = req.body;
    if (!name || !price || !quantity || !category_id) {
      return res.status(400).send("All fields are required.");
    }

    // Check if price and quantity are valid numbers
    if (isNaN(price) || isNaN(quantity)) {
      return res.status(400).send("Price and quantity must be valid numbers.");
    }

    let newImage = oldProduct.image; // Default: keep old image if no new image uploaded
    if (req.file) {
      newImage = req.file.path; // Get the new image URL from Cloudinary

      // If old image exists, delete it from Cloudinary
      if (oldProduct.image) {
        const publicId = oldProduct.image.split('/').slice(7).join('/').split('.')[0]; // Extract the public ID
        console.log("Public ID to delete:", publicId);
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error deleting image from Cloudinary:", error);
          } else {
            console.log("Old image deleted successfully:", result);
          }
        });
      }
    }

    const updated = await updateProduct(productId, name, description, price, quantity, category_id, newImage);

    if (!updated) {
      return res.status(404).send("Product not found or not updated");
    }

    res.redirect(`/products/${productId}`);
  } catch (err) {
    console.error("Error updating product:", err);

    if (err.message === 'This product cannot be edited as it is a default item.') {
      return res.status(400).send(err.message);
    }

    res.status(500).send("Server Error");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await deleteProductById(id);

    if (!deletedProduct) {
      return res.status(404).send("Product not found");
    }

    // Handle image deletion
    if (deletedProduct.image) {
      const imageUrl = deletedProduct.image;

      if (imageUrl.startsWith('http')) {
        // Delete from Cloudinary
        const parts = imageUrl.split('/');
        const folder = parts[parts.length - 2];
        const filename = parts[parts.length - 1].split('.')[0];
        const publicId = `${folder}/${filename}`;

        cloudinary.uploader.destroy(publicId, (err, result) => {
          if (err) {
            console.error("Failed to delete image from Cloudinary:", err);
          } else {
            console.log("Cloudinary image deleted:", result);
          }
        });
      } else {
        // 📂 Delete from local uploads folder
        const imagePath = path.join(__dirname, '..', 'public', 'uploads', deletedProduct.image);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.warn("Local image deletion failed:", err.message);
          }
        });
      }
    }

    res.redirect('/products');
  } catch (err) {
    console.error("Error deleting product:", err);

    if (err.message === 'This product cannot be deleted as it is a default item.') {
      return res.status(400).send(err.message);
    }

    res.status(500).send("Server Error");
  }
};

module.exports = {
  getProducts,
  getProductDetails,
  getProductForm,
  addNewProduct,
  editProduct,
  deleteProduct
}
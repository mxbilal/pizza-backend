const express = require('express');
const router = express.Router();
const Products = require('../app/controllers/Products/Products');
const { check } = require('express-validator');
const { 
  productPayload, 
  updateProductPayload,
  deleteProductPayload 
} = require('../app/controllers/Products/Validations');
const adminAuthController = require('../app/controllers/adminAuthController');

// admin login
router.post('/login', adminAuthController.login);

// upload product
router.post('/pizza', productPayload, Products.create)

// update product
router.put('/pizza', updateProductPayload, Products.update)

// get products
router.get('/pizza', Products.get)

// delete product
router.delete('/pizza', Products.delete)

// create pizza category
router.post('/pizza/type', Products.catergory.create)

// update pizza category
router.put('/pizza/type', Products.catergory.update);

// delete pizza category
router.delete('/pizza/type', Products.catergory.delete);

// get pizza category
router.get('/pizza/type', Products.catergory.get);


module.exports = router;
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

module.exports = router;
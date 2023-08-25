const { body, query  } = require('express-validator')
const joi = require("joi");
exports.productPayload = [ 
  body('name', 'Product Name dose not exist.').exists(),
  body('description', 'Please Provide Description').exists()
]   

exports.updateProductPayload = [ 
  body('id', 'id is required').exists()
]

exports.deleteProductPayload = [ 
  query('id', 'id is required').exists()
]

exports.createCategoryPayload = joi.object({
  productId: joi.number().required(), 
  type: joi.string().trim(true).required(),
  prize: joi.string().trim(true).required()
});

exports.updateCategoryPayload = joi.object({
  id: joi.number().required(),
  type: joi.string().trim(true),
  prize: joi.string().trim(true)
});

exports.deleteCategoryPayload = joi.object({
  id: joi.number().required()
});

exports.getCategoryPayload = joi.object({
  id: joi.number().required(),
  perPage: joi.number().required(),
  pageNo: joi.number().required()
});
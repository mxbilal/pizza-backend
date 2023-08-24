const { body, query  } = require('express-validator')
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
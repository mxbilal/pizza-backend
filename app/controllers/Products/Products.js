const db = require("../../models");
const { validationResult } = require('express-validator');
const { createCategoryPayload, updateCategoryPayload, deleteCategoryPayload, getCategoryPayload } = require("./Validations")
module.exports = {
  async create(req, res){
    try {
      const errors = validationResult(req)
      if (errors.isEmpty()) {
        let payload = req?.body;
        let addedProduct = await db.products.create(payload);
        if (addedProduct?.dataValues) {
          console.log("added", addedProduct?.dataValues);
          
          res.status(200).send({ success: true, message: "Product Added." });
          
        } else {
          console.log("something went wrong.");
          res
            .status(400)
            .send({ success: false, message: "Could not Add Product." });
        }
      }
      res.status(422).json({errors: errors.array()})
    } catch (err) {
      console.log("error", err);
      res.status(503).send({ success: false, message: "Internal Server Error." });
    }
  },
  async update(req, res){
    try {
      const errors = validationResult(req)
      if (errors.isEmpty()) {
        let payload = req?.body;
        let updatedProduct = await db.products.update(payload, {
          where: {
            id: payload.id
          }
        });
        if (updatedProduct[0] > 0) {
          console.log("updatedProduct", updatedProduct);
          
          res.status(200).send({ success: true, message: "Product Updated." });
          
        } else {
          console.log("something went wrong.");
          res
            .status(400)
            .send({ success: false, message: "Could not Update Product." });
        }
      }
      res.status(422).json({errors: errors.array()})
    } catch (err) {
      console.log("error", err);
      res.status(503).send({ success: false, message: "Internal Server Error." });
    }
  },
  async get(req, res){
    try {
      let { perPage, pageNo } = req?.query;
      console.log(perPage, pageNo)
      let products = await db.products.findAll({
        offset: (parseInt(pageNo) - 1)  * parseInt(perPage),
        limit: parseInt(perPage),
        where: {
          isDeleted: false
        }
      });
      if(products?.length)
        res.status(200).send({ success: true, data: products })
      else 
        res.status(200).send({ success: false, message: "Data not found.", data: products })
    } catch (err) {
      console.log("error", err);
      res.status(503).send({ success: false, message: "Internal Server Error." });
    }
  },
  async delete(req, res){
    try {
      let { id } = req?.query;
      let deletedProduct = await db.products.update(
        {isDeleted: true},{
          where: {
            id
          }
        }
      );     
      if (deletedProduct[0] > 0) {
        console.log("deletedProduct", deletedProduct);
        
        res.status(200).send({ success: true, message: "Product Deleted." })
        
      } else {
        console.log("something went wrong.");
        res
          .status(200)
          .send({ success: false, message: "Could not delete Product." });
      }
    } catch (err) {
      console.log("error", err);
      res.status(503).send({ success: false, message: "Internal Server Error." });
    }
  },
  catergory: {
    async create(req, res){
      try {
        const { error, value } = createCategoryPayload.validate(req.body)
        if (!error) {
          console.log("payload", value)
          let addedCategory = await db.categories.create(value);
          if (addedCategory?.dataValues) {
            console.log("added", addedCategory?.dataValues);
            
            res.status(200).send({ success: true, message: "Category Added." });
            
          } else {
            console.log("something went wrong.");
            res
              .status(400)
              .send({ success: false, message: "Could not Add Category." });
          }
        }
        else
          res.status(422).json({success: false, errors: error.message})
      } catch (err) {
        console.log("error", err);
        res.status(503).send({ success: false, message: "Internal Server Error." });
      }
    },
    async update(req, res){
      try {
        const { error, value } = updateCategoryPayload.validate(req.body)
        if (!error) {
          let updatedCategory = await db.categories.update(value, {
            where: {
              id: value.id
            }
          });
          if (updatedCategory[0] > 0) {
            console.log("updatedCategory", updatedCategory);
            
            res.status(200).send({ success: true, message: "Category Updated." });
            
          } else {
            console.log("something went wrong.");
            res
              .status(400)
              .send({ success: false, message: "Could not Update Category." });
          }
        } 
        else
          res.status(422).json({success: false, errors: error?.message})
      } catch (err) {
        console.log("error", err);
        res.status(500).send({ success: false, message: "Internal Server Error." });
      }
    },
    async delete(req, res){
      try {
        const { error, value } = deleteCategoryPayload.validate(req.query)
        if (!error) {
          let deletedCategory = await db.categories.update({
            isDeleted: true
          }, {
            where: {
              id: value.id
            }
          });
          if (deletedCategory[0] > 0) {
            console.log("deletedCategory", deletedCategory);
            
            res.status(200).send({ success: true, message: "Category Deleted." });
            
          } else {
            console.log("something went wrong.");
            res
              .status(400)
              .send({ success: false, message: "Could not Delete Category." });
          }
        }
        else
          res.status(422).json({success: false, errors: error.message})
      } catch (err) {
        console.log("error", err);
        res.status(500).send({ success: false, message: "Internal Server Error." });
      }
    },
    async get(req, res){
      try {
        const { error, value: {perPage, pageNo} } = getCategoryPayload.validate(req.query);
        if(!error){
          let categories = await db.categories.findAll({
            offset: (parseInt(pageNo) - 1)  * parseInt(perPage),
            limit: parseInt(perPage),
            where: {
              isDeleted: false
            }
          });
          if(categories?.length)
            res.status(200).send({ success: true, data: categories })
          else 
            res.status(200).send({ success: false, message: "Data not found.", data: categories })
        } else res.status(422).json({success: false, errors: error.message})
      } catch (err) {
        console.log("error", err);
        res.status(503).send({ success: false, message: "Internal Server Error." });
      }
    },
  }
}
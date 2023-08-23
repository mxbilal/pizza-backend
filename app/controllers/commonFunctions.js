require('dotenv').config();
const db = require('../models');
const { Op } = require("sequelize");
const jwt = require('jsonwebtoken');
const e = require('express');
// get all cities
exports.getAllCities = async (req, res) => {
   
    try{
        let page = req?.params?.page; 
        console.log("======pages====",page)
        const entries = 50
         const pageNumber = page > 0 ? (page - 1) * entries : 0
        let cityId = req?.params?.id;
        if( cityId ){
            if( cityId === "all" ){
                let allCities = await db.cities.findAll({
                    offset:pageNumber , 
                    limit: entries,

                    where:{
                        isDeleted: false
                    },
                     order:[
                        ['cityName', 'ASC'],
                    ]
                });
                if( allCities?.length ){
                    res.status(200).send({ succes: true, data: allCities })
                } else {
                    res.status(400).send({ succes: false, message: 'No Cities.' })
                }
            } else if( cityId ){
                let cityData = await db.cities.findOne({
                    where:{
                        id: cityId,
                        isDeleted: false
                    }
                })
                console.log("cityData", cityData)
                if( cityData ){
                    res.status(200).send({ succes: true, data: cityData })
                } else {
                    console.log("data not found.");
                    res.status(404).send({ succes: false, message: "data not found." })
                }
            } else {
                console.log("something bad.");
            }
        } else {
            console.log("send proper data.");
            res.status(400).send({ success: false, message: 'Send Proper Data.' });
        }
    } catch( err ){
        console.log("error", err);
        res.status(503).send({ success: false, message: 'Internal Server Error.' });
    }
}
exports.getAllCitiesByState = async (req, res) => {
    try{
        let pageNumber = req?.params?.page;
        console.log("pagenumber",pageNumber);
        const entries = 50
        if(pageNumber==='all'){
            pageNumber==='all'
        }else{
            pageNumber =pageNumber > 0 ? (pageNumber - 1) * entries : 0
        }
        console.log("page number",pageNumber);
        let stateId = req?.params?.id;
        if( stateId ){
            if(pageNumber =='all'){
                let allCities = await db.cities.findAll({
                    where:{
                        stateId: stateId,
                        isDeleted: false
                       
                    },
                    order:[
                        ['cityName', 'ASC'],
                    ]
                });
                if( allCities?.length ){
                    res.status(200).send({ succes: true, data: allCities })
                } else {
                    res.status(400).send({ succes: false, message: 'No Cities.' })
                }

            }
            else{ let allCities = await db.cities.findAll({
                    offset:pageNumber, 
                    limit: entries,
                    where:{
                        stateId: stateId
                    },
                    order:[
                        ['cityName', 'ASC'],
                    ]
                });
                if( allCities?.length ){
                    res.status(200).send({ succes: true, data: allCities })
                } else {
                    res.status(400).send({ succes: false, message: 'No Cities.' })
                }
            }
        } else {
            console.log("send proper data.");
            res.status(400).send({ success: false, message: 'Send Proper Data.' });
        }
    } catch( err ){
        console.log("error", err);
        res.status(503).send({ success: false, message: 'Internal Server Error.' });
    }
}
exports.getAllStates = async (req, res) => {
    try{
        let cityId = req?.params?.id;
      
                let allStates = await db.states.findAll({
                    order: [
                        // ['id', 'DESC'],
                        ['stateName', 'ASC'],
                    ],
                });
                if( allStates?.length ){
                    res.status(200).send({ succes: true, data: allStates })
                } else {
                    res.status(400).send({ succes: false, message: 'No States.' })
                }
       
    } catch( err ){
        console.log("error", err);
        res.status(503).send({ success: false, message: 'Internal Server Error.' });
    }
}

// get all restaurants
exports.getRestaurants = async (req, res) => {
    try{
        let cityId = req?.params?.id;
        if( cityId ){
            if( cityId === "all" ){
                let restaurantsData = await db.restaurants.findAll({
                    where: {
                        isDeleted: false
                    },
                    include:[
                        { model: db.cities }
                    ]
                });
                if( restaurantsData?.length ){
                    res.status(200).send({ succes: true, message: restaurantsData });
                } else{
                    res.status(400).send({ succes: false, message: 'No Restaurants.' })
                }
            } else {
                //find restaurants by cityId
                let restaurantData = await db.restaurants.findAll({
                    where: {
                        cityId: cityId,
                        isDeleted: false
                    },
                    include:[
                        { model: db.cities }
                    ]
                })
                if( restaurantData?.length ){
                    res.status(200).send({ succes: true, message: restaurantData });
                } else{
                    res.status(400).send({ succes: false, message: 'No Restaurants.' })
                }
            }
        } else {
            console.log("send proper data.");
            res.status(400).send({ success: false, message: 'Send Proper Data.' })
        }
    } catch( err ){
        console.log("error", err);
        res.status(503).send({ success: false, message: 'Internal Server Error.' });
    }
}

// verifyToken
exports.verifyToken = (req, res, next) => {
    let token = req.headers['token']
    try{
        if(token){
            const verified = jwt.verify(token, process.env.JWT_TOKEN_KEY);
            if(verified){
                console.log(verified, verified?.role, verified?.id)
				req.right = verified?.role;
				req.user_id = verified?.id;
                next()
            } else {
                return res.status(401).send("access denied");
            }
        } else {
            res.status(401).send("you are not allowed to perform this action");
        }
    } catch(err){
        console.log("catch error", err)
		res.status(401).send("token expired");
    }
}

// get restaurant by id

exports.getRestaurant = async ( req, res) => {
    try{
        let restaurantId = req?.params?.id;
        if( restaurantId ){
            let restaurantData = await db.restaurants.findOne({
                where: {
                    id: restaurantId,
                    isDeleted: false
                }
            })
            if( restaurantData ){
                console.log("restaurantData", restaurantData)
                res.status(200).send({ succes: true, message: restaurantData })
            } else{
                console.log("not restaurant exist.");
                res.status(404).send({ succes: false, message: 'No Restaurant Found.' })
            }
        } else {
            console.log("send proper data.");
            res.status(400).send({ success: false, message: 'Send Proper Data.' })
        }
    } catch( err ){
        console.log("error", err);
        res.status(503).send({ success: false, message: 'Internal Server Error.' });
    }
}


// get all reservations of a particular restaurant
exports.getAllReservations = async ( req, res ) => {
    try{
        let restaurantId = req.params.id;
        if( restaurantId ){
            let reservations = await db.reservations.findAll(
                {
                    where:{
                        restaurantId: restaurantId,
                        status: {
                            [Op.or]: ["available"]
                        }
                    },
                    raw: true
                }
            )
            // console.log("reservations", reservations);
            if( reservations?.length ){
                console.log( "reservations", reservations );
                res.status(200).send({ succes: true, message: "data found.", data: reservations })
            } else{
                console.log("Not data.")
                res.status(404).send({ succes: false, message: "data not found." })
            }
        } else {
            console.log("Something is missing.");
            res.status(400).send({ success: false, message: 'Send proper data.' })
        }
    } catch( err ){
        console.log("Error", err);
        res.status(503).send({ succes: false, message: 'Server Error.' })
    }
}


// verifyToken
exports.verifyExpiration = (req, res) => {
    let token = req.headers['token']
    try{
        if(token){
            const verified = jwt.verify(token, process.env.JWT_TOKEN_KEY);
            if(verified){
                console.log(verified, verified?.role, verified?.id)
				req.right = verified?.role;
				req.user_id = verified?.id;
                res.status(200).send({ succes: true, message: "valid" });
                // next()
            } else {
                return res.status(401).send("access denied");
            }
        } else {
            res.status(401).send({ succes: false, message: "you are not allowed to perform this action"});
        }
    } catch(err){
        console.log("catch error", err)
		res.status(401).send({ succes: false, message: "token expired"});
    }
}
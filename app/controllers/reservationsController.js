const db = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require("sequelize");
const sequelize = require("sequelize");
const jwt = require('jsonwebtoken');
require('dotenv').config();


const makeCode = async ( ) => {
	try{

		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let notExist = true
		do{
			for (var i = 0; i < 7; i++){
				text += possible.charAt(Math.floor(Math.random() * possible.length));
			}
			let reservationCode = await db.reservations.findOne({
				where: { 
					code: text
				},
				raw: true
			})
			console.log("reservationCode", reservationCode)
			if( !reservationCode ){
				notExist = false
			}
		} while(notExist)
		return text;
	} catch(err){
		console.log("error", err);
        return { error: true }
	}
}


// admin add reservations
exports.addReservations = async ( req, res, next ) => {
    console.log("add reservations.")
	try{
		createdBy = req.user_id;
        let reservationCode = req.body.code;
        console.log("admin", createdBy)
        let { date, time, price, seats, restaurantId } = req.body;

        if( date && time && price && reservationCode && restaurantId && seats ){
            let addedReservation = await db.reservations.create({
                date,
                time,
                seats,
                price,
                code: reservationCode,
                restaurantId: restaurantId,
                createdBy: createdBy
            })
            if( addedReservation?.dataValues ){
                console.log("reservation added.");
                res.status(200).send({ success: true, message: "reservation added." })
            } else {
                console.log("could not add.");
                res.send({ success: false, message: "could not add reservations." });
            }
        } else{
            console.log("something is missing");
            res.status(400).send({ success: false, message: "Send Proper Data." })
        }
		// let generatedCode = generateReservationCode()
	} catch( err ){
		console.log("error", err);
        res.status(503).send({ success: false, message: "Server Error." })
	}
}


// generate code for reservation
exports.generateCode = async ( req, res, next ) => {
    try{
        let generatedCode = await makeCode();
        if( generatedCode.error ){
            console.log("Server Error.");
            res.status(503).send({ success: false, message: "Server Error." });
        } else if( generatedCode ){
            console.log("generatedCode", generatedCode);
            res.status(200).send({ success: true, message: "your code.", data: generatedCode })
        }
    } catch(err){
        console.log("error", err);
        res.status(503).send({ success: false, message: "Server Error." })
    }
}

// update reservation id
exports.updateReservations = async ( req, res, next ) => {
    try{

        let reservationCode = req.body.code;
        let { date, price, seats, reservationId } = req.body;

        if( date && price && reservationCode && reservationId && seats ){
            let updatedReservation = await db.reservations.update(
                {
                    // date: date,
                    // time: time,
                    // seats: seats,
                    // price: price,
                    date, seats, price
                },
                {
                    where: {
                        id: reservationId,
                        status: process.env.STATUS_AVAILABLE ?? "available"
                    }
                }
            );
            console.log("Updated.", updatedReservation[0]);
            if( updatedReservation[0] > 0 ){
                res.status(200).send({ success: true, message: "information updated." })
            } else {
                console.log("Could not update.");
                res.send({ success: false, message: 'could not update.' })
            }
        } else{
            console.log("Send proper data.");
            res.status(400).send({ success: false, message: "Send proper data." })
        }
    } catch(err){
        console.log("error", err);
        res.status(503).send({ success: false, message: "Server Error." })
    }
}

// user edit reservation id
exports.editReservations = async ( req, res, next ) => {
    try{
        let userId=req.user_id
        let reservationCode = req.body.code;
        let { date, price, seats, reservationId } = req.body;
        console.log(req.body)

        if( reservationId  ){
            let updatedReservation = await db.reservations.update(
                {
                    date, seats, price,reservationCode,status: process.env.STATUS_AVAILABLE ?? "available"
                },
                {
                    where: {
                        id: reservationId,
                    }
                }
            );
            console.log("Updated.", updatedReservation[0]);
            if( updatedReservation[0] > 0 ){
                res.status(200).send({ success: true, message: "information updated." })
            } else {
                console.log("Could not update.");
                res.send({ success: false, message: 'could not update.' })
            }
        } else{
            console.log("Send proper data.");
            res.status(400).send({ success: false, message: "Send proper data." })
        }
    } catch(err){
        console.log("error", err);
        res.status(503).send({ success: false, message: "Server Error." })
    }
}

//user delete reservation
exports.userDeleteReservations = async ( req, res, next ) => {
    try{
        let reservationId = req.params.id;
        if( reservationId ){
            let deletedReservation = await db.reservations.update(
                {
                    status: process.env.STATUS_DELETED ?? "deleted"
                },
                {
                    where: {
                        id: reservationId
                    }
                }
            )
            console.log( "deletedReservation", deletedReservation )
            if( deletedReservation[0] > 0 ){
                res.status(200).send({ success: true, message: 'deleted successfully.' });
            } else{
                res.send({ success: false, message: 'could not delete.' })
            }
        } else {
            console.log("something is missing.");
            res.status(400).send({ success: false, message: 'Send proper data.' });
        }
    } catch( err ){
        console.log("erorr", err);
        res.status(503).send({ success: false, message: 'Server Error.' })
    }
}
// For addmin, we need to get all including sold and available
exports.getReservations = async ( req, res, next ) => {
    try{
        let reservationId  = req.params.id;
        if( reservationId ){
            if( reservationId === "sold" ){
                // for sold reservations
                let soldReservations = await db.bookings.findAll(
                    {
                        include: [
                            {
                                model: db.reservations,
                                where: {
                                    status: process.env.STATUS_SOLD
                                },
                                include: [
                                    {
                                        model: db.restaurants,
                                        isDeleted: false,
                                        required: true,
                                        include: [
                                            {
                                                model: db.cities,
                                                where: {
                                                    isDeleted: false
                                                },
                                                required: true
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                model: db.users,
                                where: {
                                    isDeleted: false,
                                },
                                required: true
                            }
                        ]
                    }
                );
                if ( soldReservations?.length ){
                    console.log("soldReservations", soldReservations);
                    res.status(200).send({ success: true, message: 'data found.', data: soldReservations });
                } else {
                    console.log("soldReservations", soldReservations, "no solds available.");
                    res.status(404).send({ success: false, message: 'data not found.' });
                }
            } else if( reservationId === "available" ) {
                // for available reservations
                let availableReservations = await db.reservations.findAll(
                    {
                        where: {
                            status: process.env.STATUS_AVAILABLE
                        },
                        include: [
                            {
                                model: db.restaurants,
                                isDeleted: false,
                                required: true,
                                include: [
                                    {
                                        model: db.cities,
                                        where: {
                                            isDeleted: false
                                        },
                                        required: true
                                    }
                                ]
                            }
                        ],
                        required: true
                    }
                )
                if ( availableReservations?.length ){
                    console.log("availableReservations", availableReservations);
                    res.status(200).send({ success: true, message: 'data found.', data: availableReservations });
                } else{
                    console.log("availableReservations", availableReservations, "no reservationsAvailble");
                    res.status(404).send({ success: false, message: 'data not found.' });
                }
            } else if( reservationId ){
                // for particular reservation data.
                let reservationsData = await db.reservations.findAll(
                    {
                        where: {
                            id: reservationId,
                            status: {
                                [Op.or]: ["available", "sold"]
                            },
                        },
                        include: [
                            {
                                model: db.restaurants,
                                isDeleted: false,
                                required: true
                            }
                        ],
                    }
                )
                if ( reservationsData?.length ){
                    console.log("reservationData", reservationsData)
                    res.status(200).send({ success: true, message: 'data found.', data: reservationsData })
                } else{
                    console.log("reservationsData", reservationsData, "no reservationsData");
                    res.status(404).send({ success: false, message: 'data not found.' });
                }
            } else {
                console.log("no id");
                res.send({ success: false, message: 'send valid data.' });
            }
        } else {
            console.log("Something is missing.");
            res.status(400).send({ success: false, message: "Send proper data." })
        }
    } catch( err ){
        console.log("Error", err);
        res.status(503).send({ success: false, message: "Server Error." })
    }
}

// delete reservation.
exports.deleteReservations = async ( req, res, next ) => {
    try{
        let reservationId = req.params.id;
        if( reservationId ){
            let deletedReservation = await db.reservations.update(
                {
                    status: process.env.STATUS_DELETED ?? "deleted"
                },
                {
                    where: {
                        id: reservationId
                    }
                }
            )
            console.log( "deletedReservation", deletedReservation )
            if( deletedReservation[0] > 0 ){
                res.status(200).send({ success: true, message: 'deleted successfully.' });
            } else{
                res.send({ success: false, message: 'could not delete.' })
            }
        } else {
            console.log("something is missing.");
            res.status(400).send({ success: false, message: 'Send proper data.' });
        }
    } catch( err ){
        console.log("erorr", err);
        res.status(503).send({ success: false, message: 'Server Error.' })
    }
}


// filter reservations based on seat and price
exports.filterReservations = async ( req, res ) => {
    try{
        let { priceStartRange, priceEndRange, seatStartRange, seatEndRange, cityId } = req.body;
        console.log("filterReservation.");
        if( priceStartRange && priceEndRange && seatStartRange && seatEndRange ){
            let filteredReservations = await db.cities.findOne({
                where: {
                    id: cityId
                },
                include: [
                    {
                        model: db.restaurants,
                        where:{
                            isDeleted: false,
                        },
                        include:[
                            {
                                model: db.reservations,
                                where: {
                                    seats: {
                                        [Op.and]: {
                                            [Op.gte]: seatStartRange,
                                            [Op.lte]: seatEndRange
                                        }
                                    },
                                    price: {
                                        [Op.and]: {
                                            [Op.gte]: priceStartRange,
                                            [Op.lte]: priceEndRange
                                        }
                                    },
                                    status: process.env.STATUS_AVAILABLE,
                                },
                                required: true
                            }
                        ],
                        required: true
                    }
                ]
            })
            // let filteredReservations = await db.reservations.findAll({
                // where: {
                //     seats: {
                //         [Op.and]: {
                //             [Op.gte]: seatStartRange,
                //             [Op.lte]: seatEndRange
                //         }
                //     },
                //     price: {
                //         [Op.and]: {
                //             [Op.gte]: priceStartRange,
                //             [Op.lte]: priceEndRange
                //         }
                //     },
                //     status: process.env.STATUS_AVAILABLE,
                // },
            //     include:[
            //         { model: db.restaurants }
            //     ],
            //     raw: true
            // })
            let reservationCount = await db.sequelize
                                    .query(`CALL countByPriceAndSeats(${cityId}, 
                                        ${priceStartRange}, ${priceEndRange}, 
                                        ${seatStartRange}, ${seatEndRange})`)
            console.log( "filteredReservations", filteredReservations, "reservationCount", reservationCount )
            if( filteredReservations ){
                res.status(200).send({ success: true, message: "data found.", data: {
                    filteredReservations: filteredReservations,
                    count: reservationCount
                } })
            } else{
                console.log("No data found.");
                res.status(404).send({ success: false, message: "no data found." })
            }
        } else {
            console.log("Something is missing.");
            res.status(400).send({ success: false, message: "Send Proper Data." });
        }
    } catch( err ){
        console.log("error", err);
        res.status(503).send({ success: false, message: "Server Error." })
    }
}


// filter reservations based on date
exports.filterDateReservations = async ( req, res ) => {
    try{
        let { date, cityId } = req.body
        date=date.split('T')[0]
        // let cdate='2022-11-15T14:13:14.713Z';
        console.log("string on array",date); 

        
        if( date && cityId) {
            // let filteredReservations = await db.reservations.findAll({
            //     where:{
            //         date,
            //         status: process.env.STATUS_AVAILABLE
            //     },
            //     include:[
            //         { model: db.restaurants }
            //     ],
            //     raw: true
            // })
            let filteredReservations = await db.cities.findOne({
                where: {
                    id: cityId
                },
                include: [
                    {
                        model: db.restaurants,
                        where:{
                            isDeleted: false,
                        },
                        include:[
                            {
                                model: db.reservations,
                                where:{
                                    date:{
                                            [Op.like]: `${date}%`
                                    },
                                    status: process.env.STATUS_AVAILABLE
                                },
                                required: true
                            }
                        ],
                        required: true
                    }
                ]
            })
            // let reservationCount = await db.sequelize.query(`CALL countByDate(${cityId}, "${date}")`)
            let reservationCount = await db.sequelize.query(`CALL countByDate(${cityId}, "${date+'%'}")`)            
            console.log( "filteredReservations", filteredReservations, "reservationCount", reservationCount )
            if( filteredReservations ){
                console.log("found");
                res.status(200).send({ success: true, message: "data found.", 
                    data: {
                        filteredReservations: filteredReservations,
                        count: reservationCount   
                    } 
                })
            } else {
                console.log("not found.");
                res.status(404).send({ success: false, message: "data not found." })
            }
        } else {
            console.log("date is missing.");
            res.status(400).send({ success: false, message: 'Send Proper Data.' })
        }
    } catch( err ){
        console.log("Error", err);
        res.status(503).send({ success: false, message: "Server Error." })
    }
}

// get all reservations and restaurants of city
exports.cityReservations = async( req, res ) => {
    try{
        let cityId = req.params.cityId;
        if( cityId ){
            let cityReservationsData = await db.cities.findOne({
                where: {
                    id: cityId
                },
                include: [
                    { 
                        model: db.restaurants,
                        where: {
                            isDeleted: false
                        },
                        include: [
                            {
                                model: db.reservations,
                                where: {
                                    status: process.env.STATUS_AVAILABLE,
                                    date: { [Op.gt]: new Date() }

                                },
                                required: true,
                            }
                        ],
                        required: true,
                    }
                ],
            })
            console.log(cityId)
            let reservationCount = await db.sequelize.query(`CALL countOfReservations(${cityId})`)
            console.log("cityReservationsData", cityReservationsData, "reservationCount", reservationCount);
            if( cityReservationsData ){
                res.status(200).send({ success: true, message: "data found", data: {
                    cityReservationsData: cityReservationsData,
                    count: reservationCount
                } })
            } else {
                console.log("not data found.");
                res.status(404).send({ success: false, message: "data not found." });

            }
        } else {
            console.log("date is missing.");
            res.status(400).send({ success: false, message: 'Send Proper Data.' })
        }
    } catch( err ){
        console.log("error", err)
        res.status(503).send({ success: false, message: "Server Error." })
    }
}
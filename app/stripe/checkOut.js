require('dotenv').config();
const db = require('../models');
const stripe = require('stripe')(process.env.CLIENT_STRIPE_SECRET_KEY);
let SUCCESSURL="http://www.rezzlist.com/Congratulations"


exports.startCheckOut = async ( req, res ) => {
    try{

        // let userId=req.user_id
        let { price, reservationId,userId } = req.body;
       
        let availableReservation = await db.reservations.findOne({
            where: {
                id: reservationId,
                status: process.env.STATUS_AVAILABLE
            }
        })
        if( availableReservation ){
            if( userId && price && reservationId  ){
                const session = await stripe.checkout.sessions.create({
                    line_items: [
                      {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: 'reservation',
                            },
                            unit_amount: price*100,
                        },
                        quantity: 1,
                      },
                    ],
                    mode: 'payment',
                    // success_url: `${process.env.API_URL}/api/user/success/checkout?session_id={CHECKOUT_SESSION_ID}&userId=${userId}`,
                    // cancel_url: `${process.env.API_URL}/api/checkout/cancel`,
                    success_url: `${process.env.API_URL}/api/user/success/checkout?session_id={CHECKOUT_SESSION_ID}&userId=${userId}&reservationId=${reservationId}`,
                    cancel_url: `${process.env.FRONTEND_HOST}/checkout/cancel`,
                });
                console.log("checkout reponse", session)
                res.send({ success: true, url:session.url});
            } else {
                console.log("Something is missing.");
                res.status(400).send({ success: false, message: "Send proper Data." })
            }
        } else {
            console.log("this reservation is occupied.");
            res.send({ success: false, message: "This reservation is already occupied." })
        }
    } catch( err ){
        console.log("Error", err);
        res.status(503).send({ success: false, message: "Server Error." })
    }
}


// add data to database on success
exports.successCheckOut = async ( req, res ) => {
    try{
        let { session_id, userId, reservationId } = req.query;
        console.log("inside checkout", session_id, userId, reservationId)
        if ( session_id && userId && reservationId ){
            const session = await stripe.checkout.sessions.retrieve(session_id);
            const customer = await stripe.customers.retrieve(session.customer);
            console.log("customer info", customer, userId, reservationId, session );
            let soldReservation = await db.reservations.update(
                {
                    status: process.env.STATUS_SOLD
                },
                {
                    where:{
                        id: reservationId,
                        status: process.env.STATUS_AVAILABLE
                    }
                }
            )
            console.log("soldReservation", soldReservation)
            if( soldReservation[0] > 0 ){
                let addedBooking = await db.bookings.create(
                    { 
                        amount: session?.amount_total, 
                        reservationId,
                        userId,
                        status: process.env.STATUS_BOUGHT,
                        transactionId: session?.id,
                    }
                )
                if( addedBooking?.dataValues ){
                    console.log("booking added", addedBooking);
                    let reservationData = await db.reservations.findAll(
                        {
                            where: {
                                id: reservationId,
                            },
                            include: [
                                {
                                    model: db.restaurants,
                                    include: [
                                        {
                                            model: db.cities,
                                            required: true
                                        }
                                    ],
                                    required: true
                                }
                            ],
                            required: true
                        }
                    )
                    console.log("reservationData", reservationData)
                    res.redirect(SUCCESSURL, 302);
                    return res.end();
                    // res.status(200).send({ success: true, message: "booking added.", data: reservationData })
                } else {
                    console.log("could not add booking.");
                    res.send({ success: false, message: 'could not added the booking.' })
                }
            } else {
                console.log("not found.");
                res.status(404).send({ success: false, message: "sorry this reservation is not available anymore." });
            }
        } else {
            console.log("Something is missing");
            res.status(400).send({ success: false, message: "Send proper data." });
        }
        // res.send(`<html><body><h1>Thanks for your order, ${customer.name}!</h1></body></html>`);
    } catch( err ){
        console.log("Error", err);
        res.status(503).send({ success:false, message: "Server Error." })
    }
}


// on cancel url

exports.cancelCheckOut =  async ( req, res ) => {
    try{
        res.status(500).send({ success: false, message: "could not proceed your checkout." })
    } catch( err ){
        console.log("Error", err);
        res.status(503).send({ success: false, message: "Server error." })
    }
}
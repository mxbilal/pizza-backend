require("dotenv").config();
const db = require("../models");
const stripe = require("stripe")(process.env.CLIENT_STRIPE_SECRET_KEY);
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.SALT_FOR_ACCOUNT);
let SUCCESSURL="http://www.pizza.com/Congratulations"


exports.createReservation = async (req, res) => {
  try {
    // const userId=req?.user_id
    let {date, price, seats, code, restaurantId,userAccount,userId} = req.body;
    userAccount =await cryptr.encrypt(userAccount);
    console.log("===user id==",userId)
    let reservationPrice=price
    let charges= reservationPrice>0 && reservationPrice<=100?200:reservationPrice>100 && reservationPrice<=500?300:500
    if (userId && price) {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "reservation",
              },
              unit_amount: charges,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        // success_url: `${process.env.FRONTEND_HOST}/checkout/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}&reservationId=${reservationId}`,
        success_url: `${process.env.API_URL}/api/user/reservationbyuser?date=${date}&price=${price}&code=${code}&restaurantId=${restaurantId}&seats=${seats}&userId=${userId}&userAccount=${userAccount}`,
        cancel_url: `${process.env.FRONTEND_HOST}/checkout/cancel`,
      });
      res.send({ success: true, url: session.url });
    } else {
      res.status(400).send({ success: false, message: "Send proper Data." });
    }
  } catch (err) {
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

exports.addUserReservations = async (req, res) => {
  try {
    let {userId, date, price, seats, restaurantId, code,userAccount } = req.query;
    if (date  && price && code && restaurantId && seats && userAccount) {
      let addedReservation = await db.reservations.create({
        date,
        seats,
        price,
        code: code,
        restaurantId: restaurantId,
        createdBy: userId,
        userAccount,
        payoutStatus: process.env.PAYMENT_STATUS_INCOMPLETE,
      });
      if (addedReservation?.dataValues) {
        console.log("reservation added.");
        res.redirect(SUCCESSURL, 302);
                    return res.end();
        // res.status(200).send({ success: true, message: "reservation added." });
      } else {
        console.log("could not add.");
        res.send({ success: false, message: "could not add reservations." });
      }
    } else {
      console.log("something is missing");
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
    // let generatedCode = generateReservationCode()
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

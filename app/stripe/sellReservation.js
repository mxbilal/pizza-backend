require("dotenv").config();
const db = require("../models");
const stripe = require("stripe")(process.env.CLIENT_STRIPE_SECRET_KEY);
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.SALT_FOR_ACCOUNT);
let SUCCESSURL="http://www.rezzlist.com/Congratulations"


exports.sellPurchasedReservation = async (req, res) => {
    try {
      // const userId=req?.user_id
      let {reservationId,userAccount,price,userId } = req.body;
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
          success_url: `${process.env.API_URL}/api/user/sellReservation?reservationId=${reservationId}&userAccount=${userAccount}&price=${price}`,
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

  exports.sellReservations = async ( req, res, next ) => {
    try{
        let { price, userAccount, reservationId } = req.query;
        console.log("===query",req.query)

        if( reservationId  ){
            let updatedReservation = await db.reservations.update(
                {
                     price:price,
                     userAccount:userAccount,
                     status: process.env.STATUS_AVAILABLE ?? "available",
                     payoutStatus: process.env.PAYMENT_STATUS_INCOMPLETE??"incomplete",
                },
                {
                    where: {
                        id: reservationId
                        // status: process.env.STATUS_BOUGHT ?? "bought"
                    }
                }
            );
            console.log("exectuedddd================")
            console.log("Updated.", updatedReservation[0]);
            if( updatedReservation[0] > 0 ){
              res.redirect(SUCCESSURL, 302);
                    return res.end();
                // res.status(200).send({ success: true, message: "Listed to sell." })
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
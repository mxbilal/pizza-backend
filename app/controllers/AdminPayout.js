require("dotenv").config();
const db = require("../models");
const Cryptr = require("cryptr");
const { request } = require("express");
const cryptr = new Cryptr(process.env.SALT_FOR_ACCOUNT);

exports.getAllPayoutRequest = async (req, res) => {
  try {
    let payouts = await db.reservations.findAll({
      where: {
        payoutStatus: process.env.PAYMENT_STATUS_INCOMPLETE,
        status: process.env.STATUS_SOLD,
      },
    });
    //for each to decrypt user account and send back to admin
    payouts.forEach((element) => {
      element.userAccount = cryptr.decrypt(element.userAccount);
    });

    if (payouts) {
      res.status(200).send({ success: true, message: "Data found.", payouts });
    } else {
      res.status(400).send({ success: true, message: "no data Found." });
    }
  } catch (err) {
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

//admin hit this after successful payout
exports.payoutSuccess = async (req, res) => {
  try {
    let { reservationId, payoutReferenceId } = req.body;
    if (payoutReferenceId) {
      let payout = await db.reservations.findOne({
        where: { id: reservationId },
      });
      if (payout) {
        let updatePayout = await db.reservations.update(
          {
            payoutStatus: process.env.PAYMENT_STATUS_COMPLETE,
            payoutReferenceId: payoutReferenceId,
          },
          {
            where: {
              id: reservationId,
              status: process.env.STATUS_SOLD,
            },
          }
        );
        if (updatePayout == 1) {
          res
            .status(200)
            .send({ success: true, message: "Payout Updated Successfully." });
        } else {
          res
            .status(400)
            .send({ success: false, message: "Payout cannot be updated." });
        }
      } else {
        res.status(400).send({ success: false, message: "no data Found." });
      }
    } else {
      res.status(400).send({ success: false, message: "send proper data." });
    }
  } catch (err) {
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

require("dotenv").config();
const { reservations } = require("../models");
const db = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");

// exports.addBookings = async (req, res, next) => {
//   try {
//     let { amount, reservationId, userId } = req.body;
//     if (amount && reservationId && userId) {
//       console.log("received.", amount, reservationId, userId);
//       let soldReservation = await db.reservations.update(
//         {
//           status: process.env.STATUS_SOLD,
//         },
//         {
//           where: {
//             id: reservationId,
//             status: process.env.STATUS_AVAILABLE,
//           },
//         }
//       );
//       console.log("soldReservation", soldReservation);
//       if (soldReservation[0] > 0) {
//         let addedBooking = await db.bookings.create({
//           amount,
//           reservationId,
//           userId,
//           status: process.env.STATUS_BOUGHT,
//           transactionId: "dumy",
//         });
//         if (addedBooking?.dataValues) {
//           console.log("booking added", addedBooking);
//           res.status(200).send({ success: true, message: "booking added." });
//         } else {
//           console.log("could not add booking.");
//           res.send({ success: false, message: "could not added the booking." });
//         }
//       } else {
//         console.log("not found.");
//         res.status(404).send({
//           success: false,
//           message: "sorry this reservation is not available anymore.",
//         });
//       }
//     } else {
//       console.log("something is missing.");
//       res.status(400).send({ success: false, message: "Send proper Data." });
//     }
//   } catch (err) {
//     console.log("error", err);
//     res.status(503).send({ success: false, message: "Internal Server Error." });
//   }
// };

// Get User Reservations

exports.getMyReservations = async (req, res, next) => {
  try {
    let userId = req?.user_id;
    // const time = new Date();
    // console.log(time.toISOString());

    if (userId) {
      let availableReservations = await db.reservations.findAll({
        where: {
          createdBy: userId,
          status: process.env.STATUS_AVAILABLE,
          date: { [Op.gt]: new Date() },
        },
        include: [{ model: db.restaurants, include: [{ model: db.cities }] }],
      });
      let soldReservations = await db.reservations.findAll({
        where: {
          createdBy: userId,
          status: process.env.STATUS_SOLD,
        },
        include: [{ model: db.restaurants, include: [{ model: db.cities }] }],
      });

      let expiredReservation = await db.reservations.findAll({
        where: {
          createdBy: userId,
          date: { [Op.lte]: new Date() },
        },
        include: [{ model: db.restaurants, include: [{ model: db.cities }] }],
      });
      let myReservations = await db.reservations.findAll({
        where: {
          createdBy: userId,
        },
        include: [{ model: db.restaurants, include: [{ model: db.cities }] }],
      });

      if (
        availableReservations?.length ||
        soldReservations?.length ||
        expiredReservation?.length ||
        myReservations?.length
      ) {
        res.status(200).send({
          success: true,
          message: "data found.",
          availableReservations: availableReservations,
          soldReservations: soldReservations,
          expiredReservation: expiredReservation,
          myReservations: myReservations,
        });
      } else {
        console.log("not found.");
        res.status(404).send({ success: false, message: "no data found." });
      }
    } else {
      console.log("Something is missing.");
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

exports.getTotalEarnings = async function (req, res) {
  try {
    let userId = req?.user_id;
    console.log("user id =================", userId);
    if (userId) {
      let totalamount = await db.sequelize
        .query(`SELECT SUM(price) as totalearning FROM reservations WHERE createdBy=${userId} AND status='${process.env.STATUS_SOLD}';`);
      let count = await db.sequelize.query(
        `SELECT COUNT(*) as count
      FROM reservations WHERE createdBy=${userId} AND status='${process.env.STATUS_SOLD}';`
      );
      totalamount = totalamount[0][0].totalearning;
      count= count[0][0].count
      if (totalamount && count) {
        res
          .status(200)
          .send({ success: true, message: "data found.", earning: totalamount,count: count });
      } else {
        res.status(404).send({ success: false, message: "no data found." });
      }
    } else {
      console.log("something is missing.");
      res.status(400).send({ success: false, message: "Send Proper data." });
    }
  } catch (err) {
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

exports.getPurchasedReservations = async (req, res, next) => {
  try {
    let userId = req?.user_id;
    console.log("user", userId);
    if (userId) {
      let myReservations = await db.bookings.findAll({
        where: {
          userId: userId,
        },
        include: [
          {
            model: db.reservations,
            include: [
              {
                model: db.restaurants,
                include: [{ model: db.cities }],
              },
            ],
          },
        ],
      });
      console.log("myReservations", myReservations);
      if (myReservations?.length) {
        console.log("myReservations", myReservations);
        res
          .status(200)
          .send({
            success: true,
            message: "data found.",
            data: myReservations,
          });
      } else {
        console.log("not found.");
        res.status(404).send({ success: false, message: "no data found." });
      }
    } else {
      console.log("Something is missing.");
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

/************* admin will get user reservations *************/
exports.getUserReservations = async (req, res) => {
  try {
    let userId = req.params.id;
    if (userId) {
      let userReservations = await db.bookings.findAll({
        where: {
          userId,
        },
        include: [
          {
            model: db.reservations,
            include: [
              {
                model: db.restaurants,
                include: [
                  {
                    model: db.cities,
                    required: true,
                  },
                ],
                required: true,
              },
            ],
            required: true,
          },
        ],
        // raw: true
      });
      console.log("userReservations", userReservations);
      if (userReservations?.length) {
        res.status(200).send({ success: true, message: userReservations });
      } else {
        console.log("not data found.");
        res.status(404).send({ success: false, message: "no data found." });
      }
    } else {
      console.log("something is missing.");
      res.status(400).send({ success: false, message: "Send Proper data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

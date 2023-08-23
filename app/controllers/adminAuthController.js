const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
var nodemailer = require("nodemailer");
// const adminSession = require('../models/AdminSession');
const admins = db.admins;
/*************************** **************************/
console.log("in admin ");
// create token on admin
const createToken = async (admin) => {
  try {
    //generate access token
    const token = jwt.sign({ id: admin.id }, process.env.JWT_TOKEN_KEY, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
    //generate refresh token
    const refreshToken = jwt.sign(
      { id: admin.id },
      process.env.JWT_REFRESH_TOKEN_KEY
    );

    //insert the token in database adminsessions table.
    let adminSession = await db.adminSessions.create({
      userId: admin?.id,
      refreshToken: refreshToken,
    });

    if (adminSession) {
      console.log("adminSession", adminSession);
      return {
        accessToken: token,
        refreshToken: refreshToken,
      };
    } else {
      return { not_created: "tokens not added in." };
    }
    // save user token
  } catch (err) {
    console.log("error", err);
    return { error: true };
  }
};

// create code for admin email verification
const makeCode = async () => {
  try {
    var text = "";
    var possible = "0123456789";
    let notExist = true;
    do {
      for (var i = 0; i < 4; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      let resetCode = await db.adminResetCodes.findOne({
        where: {
          resetCode: text,
        },
        raw: true,
      });
      console.log("resetCode", resetCode);
      if (!resetCode) {
        notExist = false;
      }
    } while (notExist);
    return text;
  } catch (err) {
    console.log("error", err);
    return { error: true };
  }
};

//send email of forget password
const forgetPasswordEmail = (toUser, emailSubject, emailMessage) => {
  try {
    return new Promise((resolve, reject) => {
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "harisbakhabarpk@gmail.com",
          pass: "cfivxreljrvzlqrt",
        },
      });

      var mailOptions = {
        from: "harisbakhabarpk@gmail.com",
        to: toUser,
        subject: emailSubject,
        text: emailMessage,
      };

      let value = transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
          resolve(true);
        }
      });
    });
  } catch (err) {
    console.log("error", err);
    return { error: true };
  }
};
/*********************** *********************/
exports.login = async (req, res, next) => {
  try {
    const email = req?.body?.email?.trim?.();
    const password = req?.body?.password?.trim?.();
    console.log("in admin login");
    console.log(req.body);
    if (email && password) {
      // let adminData = await admins.findAll();
      // console.log("adminData", adminData);
      let adminData = await admins.findOne({
        where: {
          email: email,
        },
        raw: true,
      });

      if (adminData) {
        let hash = adminData?.password;
        let result = bcrypt.compareSync(password, hash);
        console.log("hash", result);
        if (result) {
          console.log("logged in.", adminData);
          let tokens = await createToken(adminData);
          if (!tokens?.not_created && !tokens.error) {
            res.status(200).send({
              adminId: adminData?.id,
              adminEmail: adminData?.email,
              firstName: adminData?.firstName,
              lastName: adminData?.lastName,
              tokens: tokens,
            });
          } else if (tokens?.not_created) {
            console.log("token not created.");
            // res.status(400).send("some error occured.")
          } else if (tokens?.error) {
            console.log("server error.");
            res.status(503).send({ success: false, message: "Server Error." });
          } else {
            console.log("something bad occured.");
            res.send({ success: false, message: "Something Bad Occured." });
          }
        } else {
          res
            .status(401)
            .send({ success: false, message: "password in incorrect." });
        }
      } else {
        res
          .status(404)
          .send({ success: false, message: "email does not exist." });
      }
    } else {
      res.status(400).send({ success: false, message: "send proper data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

// same like forget password
exports.resetPassword = async (req, res, next) => {
  try {
    receiverEmail = req?.body?.email?.trim();
    if (receiverEmail) {
      let emailVerify = await admins.findOne({
        where: {
          email: receiverEmail,
        },
        raw: true,
      });
      if (emailVerify) {
        console.log("verified", emailVerify?.id);
        let resetCode = await makeCode();
        if (resetCode) {
          let emailMessage =
            "Hi " +
            emailVerify?.firstName +
            " here is your reset password verification code " +
            resetCode +
            ".";
          let emailSubject = "Password Reset Request";
          let toUser = receiverEmail;
          let emailSend = await forgetPasswordEmail(
            toUser,
            emailSubject,
            emailMessage
          );
          console.log("emailSend", emailSend);
          if (emailSend) {
            let existedCode = await db.adminResetCodes.findOne({
              where: {
                userId: emailVerify?.id,
              },
            });
            if (existedCode) {
              await db.adminResetCodes.update(
                {
                  resetCode: resetCode,
                },
                {
                  where: {
                    userId: emailVerify?.id,
                  },
                }
              );
            } else {
              await db.adminResetCodes.create({
                resetCode: resetCode,
                userId: emailVerify?.id,
              });
            }
            res
              .status(200)
              .send({
                success: true,
                message:
                  "reset password email with verification is send to you.",
              });
          } else if (emailSend?.error) {
            console.log("could not send email.");
            res.status(503).send({ success: false, message: "Server Error." });
          } else {
            console.log("something bad occured.");
            res.send({ success: false, message: "something bad occured." });
          }
        } else if (resetCode?.error) {
          console.log("could not send email.");
          res.status(503).send({ success: false, message: "Server Error." });
        } else {
          console.log("no code found.");
        }
      } else {
        console.log("this email is not verified.");
        res
          .status(401)
          .send({ success: false, message: "email not verified." });
      }
    } else {
      console.log("send proper data.");
      res.status(400).send({ success: false, message: "Send Proper data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

// verify code after forget password, sent on email.
exports.verifyCode = async (req, res, next) => {
  try {
    let resetCode = req?.body?.verifycode;
    if (resetCode) {
      let code = await db.adminResetCodes.findOne({
        where: {
          resetCode: resetCode,
        },
        raw: true,
      });
      if (code) {
        res
          .status(200)
          .send({ success: true, verified: true, message: "code verified." });
      } else {
        res
          .status(400)
          .send({
            success: false,
            verified: false,
            message: "code not found.",
          });
      }
    } else {
      res
        .status(400)
        .send({ success: false, message: "please send verify code." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

// resend code if not received in email.
exports.resendCode = async (req, res, next) => {
  try {
    receiverEmail = req?.body?.email?.trim();
    if (receiverEmail) {
      let emailVerify = await admins.findOne({
        where: {
          email: receiverEmail,
        },
        raw: true,
      });
      if (emailVerify) {
        console.log("verified", emailVerify?.id);
        let resetCode = await makeCode();
        if (resetCode) {
          let emailMessage =
            "Hi " +
            emailVerify?.firstName +
            " here is your reset password verification code " +
            resetCode +
            ".";
          let emailSubject = "Password Reset Request";
          let toUser = receiverEmail;
          let emailSend = await forgetPasswordEmail(
            toUser,
            emailSubject,
            emailMessage
          );
          console.log("emailSend", emailSend);
          if (emailSend) {
            let existedCode = await db.adminResetCodes.findOne({
              where: {
                userId: emailVerify?.id,
              },
            });
            if (existedCode) {
              await db.adminResetCodes.update(
                {
                  resetCode: resetCode,
                },
                {
                  where: {
                    userId: emailVerify?.id,
                  },
                }
              );
            } else {
              await db.adminResetCodes.create({
                resetCode: resetCode,
                userId: emailVerify?.id,
              });
            }
            res
              .status(200)
              .send({
                success: true,
                message:
                  "reset password email with verification is send to you.",
              });
          } else if (emailSend?.error) {
            console.log("could not send email.");
            res.status(503).send({ success: false, message: "Server Error." });
          } else {
            console.log("something bad occured.");
            res.send({ success: false, message: "something bad occured." });
          }
        } else if (resetCode?.error) {
          console.log("could not send email.");
          res.status(503).send({ success: false, message: "Server Error." });
        } else {
          console.log("no code found.");
        }
      } else {
        console.log("this email is not verified.");
        res
          .status(401)
          .send({ success: false, message: "email not verified." });
      }
    } else {
      console.log("send proper data.");
      res.status(400).send({ success: false, message: "Send Proper data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

// update password after email for admin.
exports.updatePassword = async (req, res, next) => {
  try {
    let verificationCode = req?.body?.code;
    let password = req?.body?.password?.trim();
    let hashedPassword = bcrypt.hashSync(
      password,
      parseInt(process.env.BCRYPT_SALT)
    );
    let userData = await db.adminResetCodes.findOne({
      where: {
        resetCode: verificationCode,
      },
      raw: true,
    });
    if (userData) {
      let updatedRows = await admins.update(
        {
          password: hashedPassword,
        },
        {
          where: {
            id: userData?.userId,
          },
        }
      );
      console.log("updatedRows", updatedRows);
      if (updatedRows[0] > 0) {
        // db.adminResetCodes.findOne({
        // 	where: {
        // 		resetCode: verificationCode
        // 	},
        // 	raw: true
        // }).then(data => {
        // 	console.log("data", data)
        // 	data.destroy();
        // 	res.status(200).send("password update.")
        // })
        await db.adminResetCodes.destroy({
          where: {
            resetCode: verificationCode,
          },
        });
        res.status(200).send({ success: true, message: "password update." });
      } else {
        res
          .status(400)
          .send({ success: false, message: "could not reset password." });
      }
    } else {
      res
        .status(400)
        .send({ success: false, message: "this code is not valid." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};


// admin add city
exports.addCity = async (req, res, next) => {
  try {
    //TODO
    // let cityName = req?.body?.cityName?.trim();
    // let cityImg = req?.body?.cityImg?.trim();
    let { cityName, cityImg,stateId } = req?.body;
    let adminId = 1;
    if (cityName && cityImg) {
      let addedCity = await db.cities.create({
        cityName: cityName,
        cityImg: cityImg,
        stateId: stateId,
        createdBy: adminId,
      });
      if (addedCity?.dataValues) {
        res.status(200).send({ success: true, message: "City Added." });
      } else {
        res.status(400).send({ success: false, message: "Can not Add City." });
      }
    } else {
      console.log("no data sent.");
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

// admin update city
exports.updateCity = async (req, res, next) => {
  try {
    //let createdBy = 1
    // let cityName = req?.body?.cityName?.trim();
    // let cityImg = req?.body?.cityImg?.trim();
    // let cityId = req?.body?.cityId;
    let { cityName, cityImg, cityId } = req.body;
    if (cityName && cityImg && cityId) {
      let updatedCity = await db.cities.update(
        {
          cityName: cityName,
          cityImg: cityImg,
        },
        {
          where: {
            id: cityId,
            isDeleted: false,
            //createdBy: createdBy
          },
        }
      );
      if (updatedCity[0] > 0) {
        console.log("updatedCity", updatedCity);
        res.status(200).send({ success: true, message: "City Updated." });
      } else {
        res
          .status(400)
          .send({ success: false, message: "Could not Update City." });
      }
    } else {
      console.log("not proper data.");
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

// admin delete city
exports.deleteCity = async (req, res, next) => {
  try {
    //TODO
    //let createdBy = 1
    let cityId = req?.params?.id;
    if (cityId) {
      let deletedCity = await db.cities.update(
        {
          isDeleted: true,
        },
        {
          where: {
            id: cityId,
            // createdBy: createdBy
          },
        }
      );
      if (deletedCity[0] > 0) {
        res.status(200).send({ success: true, message: "City Deleted." });
      } else {
        res.status(400).send({ success: false, message: "Could not Delete." });
      }
    } else {
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

// admin add restaurant
exports.addRestaurant = async (req, res, next) => {
  try {
    let addedBy = req.user_id;
    let cityId = req?.body?.cityId;
    let location = req?.body?.location?.trim();
    let restaurantLogo = req?.body?.logo?.trim() ?? null;
    let restaurantName = req?.body?.restaurantName?.trim?.();
    let restuarantImgs = req?.body?.imgs?.map((value, index) => {
      return { [index]: value };
    });
    if (addedBy && cityId && location && restaurantName && restaurantLogo) {
      let addedRestaurants = await db.restaurants.create({
        restaurantName: restaurantName,
        img: { imgs: restuarantImgs },
        logo: restaurantLogo,
        cityId: cityId,
        location: location,
        createdBy: addedBy,
      });
      if (addedRestaurants?.dataValues) {
        console.log("added", addedRestaurants?.dataValues);
        // let restaurantId = addedRestaurants?.dataValues?.id;
        // console.log("restaurantId", restaurantId)
        res.status(200).send({ success: true, message: "Restaurant Added." });
        // let addedLocation = await db.restaurantsLocations.create({
        // 	location: location,
        // 	restaurantId: restaurantId
        // })
        // if( addedLocation?.dataValues ){
        // } else {
        // 	console.log("could not add location.")
        // 	res.status(400).send({ success: false, message: "Could not Add Restaurants." })
        // }
      } else {
        console.log("something went wrong.");
        res
          .status(400)
          .send({ success: false, message: "Could not Add Restaurants." });
      }
    } else {
      console.log("something is missing.");
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

// admin update restaurant
exports.updateRestaurant = async (req, res, next) => {
  try {
    //let createdBy = 1
    let cityId = req?.body?.cityId;
    // let location = req?.body?.location?.trim();
    let restaurantId = req?.body?.restaurantId;
    let restaurantLogo = req?.body?.logo?.trim();
    let restaurantName = req?.body?.restaurantName?.trim?.();
    let restuarantImgs = req?.body?.imgs?.map((value, index) => {
      return { [index]: value };
    });
    if (restaurantId) {
      let updatedRestaurant = await db.restaurants.update(
        {
          restaurantName: restaurantName,
          // location: location,
          logo: restaurantLogo,
          cityId: cityId,
          img: { imgs: restuarantImgs }
        },
        {
          where: {
            id: restaurantId,
            isDeleted: false,
            //createdBy: createdBy
          },
        }
      );
      if (updatedRestaurant[0] > 0) {
        console.log("updatedRestaurant", updatedRestaurant);
        res.status(200).send({ success: true, message: "Restaurant Updated." });
      } else {
        console.log("not updated.");
        res.status(400).send({ successs: false, message: "Could not Update." });
      }
    } else {
      console.log("something is missing.");
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};



// admin delete restaurant
exports.deleteRestaurant = async (req, res, next) => {
  try {
    //let createdBy = 1
    let restaurantId = req?.params?.id;
    if (restaurantId) {
      let deletedRestaurant = await db.restaurants.update(
        {
          isDeleted: true,
        },
        {
          where: {
            id: restaurantId,
            //createdBy: createdBy
          },
        }
      );
      if (deletedRestaurant[0] > 0) {
        console.log("deletedRestaurant", deletedRestaurant);
        res
          .status(200)
          .send({ success: true, message: "Deleted Successfully." });
      } else {
        console.log("could not delete");
        res.status(400).send({ success: false, message: "Could not Delete." });
      }
    } else {
      console.log("Something is missing");
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

// exports.logout = (req, res, next) => {
// 	const validationErrors = [];
// 	const { userId } = req.body;
// 	if (validator.isEmpty(userId)) {
// 		validationErrors.push('userId is required.');
// 	}
// 	if (validationErrors.length) {
// 		res.status(400).send({
// 			success: false,
// 			message: 'Issue in data which is being send',
// 			data: validationErrors,
// 		});
// 	}
// 	adminSession
// 		.findOne({
// 			where: {
// 				userId,
// 			},
// 		})
// 		.then((session) => {
// 			if (!session) {
// 				res.status(400).send({
// 					success: false,
// 					message: 'No session found against the userId',
// 				});
// 			} else {
// 				session.destroy();
// 				res.status(200).send({
// 					success: true,
// 					message: 'Logout successful',
// 				});
// 			}
// 		})
// 		.catch((err) => {
// 			console.log(err);
// 			res.status(400).send({
// 				success: false,
// 				message: err,
// 			});
// 		});
// };

// exports.signUp = (req, res, next) => {
// 	const validationErrors = [];
// 	const { firstName, lastName, email, password } = req.body;
// 	if (password && firstName && lastName && email) {
// 		if (
// 			validator.isEmpty(password) ||
// 			validator.isEmpty(firstName) ||
// 			validator.isEmpty(lastName)
// 		) {
// 			validationErrors.push(
// 				'Email, First name, Last name  and Password are required.'
// 			);
// 		}
// 	} else {
// 		if (!validator.isEmail(email)) {
// 			validationErrors.push('Please enter a valid email address.');
// 		}
// 	}
// 	if (validationErrors.length) {
// 		res.status(400).send({
// 			success: false,
// 			message: 'Issue with data being send',
// 			data: validationErrors,
// 		});
// 	}
// 	Admin.findOne({
// 		where: {
// 			email: email,
// 		},
// 	})
// 		.then((admin) => {
// 			if (!admin) {
// 				bcrypt.hash(password, 12).then(async (hashedPassword) => {
// 					const admin = new Admin({
// 						email,
// 						firstName,
// 						lastName,
// 						password: hashedPassword,
// 					});
// 					admin
// 						.save()
// 						.then((data) => {
// 							res.status(200).send({
// 								success: true,
// 								message: 'Admin Created =)',
// 								data: data,
// 							});
// 						})
// 						.catch((err) => {
// 							res.status(400).send({
// 								success: false,
// 								message: err,
// 							});
// 						});
// 				});
// 			} else {
// 				res.status(400).send({
// 					success: false,
// 					message: 'E-Mail exists already, please pick a different one.',
// 				});
// 			}
// 		})
// 		.catch((err) => console.log(err));
// };

// exports.forgotPassword = (req, res, next) => {
// 	const validationErrors = [];
// 	const { email, password } = req.body;

// 	if (!validator.isEmail(email)) {
// 		validationErrors.push('Please enter a valid email address.');
// 	}
// 	if (validationErrors.length) {
// 		res.status(400).send({
// 			success: false,
// 			message: 'Issue with data being send',
// 			data: validationErrors,
// 		});
// 	}
// 	// crypto.randomBytes(32, (err, buffer) => {
// 	// 	if (err) {
// 	// 		console.log(err);
// 	// 		// return res.redirect('/forgot-password');
// 	// 	}
// 	// 	const token = buffer.toString('hex');
// 	Admin.findOne({
// 		where: {
// 			email: email,
// 		},
// 	})
// 		.then(async (admin) => {
// 			if (!admin) {
// 				res.status(400).send({
// 					success: false,
// 					message: 'No user found with this email.',
// 				});
// 			} else {
// 				var hashedPassword = await bcrypt.hash(password, 12);
// 				admin
// 					.update({
// 						password: hashedPassword,
// 					})
// 					.then((result) => {
// 						res.status(200).send({
// 							success: true,
// 							message: 'Password updated successfully',
// 						});
// 					})
// 					.catch((err) => {
// 						res.status(400).send({
// 							success: false,
// 							message: 'Failed to update password successfully',
// 						});
// 					});
// 			}
// 			// user.resetToken = token;
// 			// user.resetTokenExpiry = Date.now() + 3600000;
// 			// return user.save();
// 		})

// 		.catch((err) => {
// 			console.log(err);
// 		});
// 	//});
// };

require("dotenv").config();
const db = require("../models");
const twilio = require("twilio");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const user = require("../models/user");
const Sequelize = require("sequelize");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// console.log("accountSid", accountSid)
const client = new twilio(accountSid, authToken);


// create token for user
const createToken = async (user) => {
  try {
    //generate access token
    const token = jwt.sign({ id: user.id }, process.env.JWT_TOKEN_KEY, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
    //generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_TOKEN_KEY
    );

    //insert the token in database adminsessions table.
    let userSession = await db.usersSessions.create({
      userId: user?.id,
      refreshToken: refreshToken,
    });

    if (userSession) {
      console.log("adminSession", userSession);
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

// create code for user number verification
const makeCode = async () => {
  try {
    var text = "";
    var possible = "0123456789";
    let notExist = true;
    do {
      for (var i = 0; i < 4; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      let code = await db.usersTwilioCodes.findOne({
        where: {
          code: text,
        },
        raw: true,
      });
      console.log("resetCode", code);
      if (!code) {
        notExist = false;
      }
    } while (notExist);
    if (text) {
      return { found: text };
    } else {
      return { not_found: "no code found." };
    }
  } catch (err) {
    console.log("error", err);
    return { error: true };
  }
};

/********************** ****************************/

exports.registerNumber = async (req, res, next) => {
  try {
    let phoneNumber = req.body.phoneNumber;
    if (phoneNumber) {
      let isRegistered = await db.users.findOne({
        where: {
          phoneNumber,
        },
      });
      console.log("isRegistered", isRegistered);
      if (!isRegistered) {
        let code = await makeCode();
        if (code?.found) {
          let twilioMessage = await client.messages.create({
            body: "your verification code is " + code?.found,
            to: phoneNumber,
            from: process.env.TWILIO_NUMBER,
          });
          console.log("twilioMessage", twilioMessage);
          if (twilioMessage) {
            let existedCode = await db.usersTwilioCodes.findOne({
              where: {
                phoneNumber: phoneNumber,
              },
            });
            if (existedCode) {
              await db.usersTwilioCodes.update(
                {
                  code: code?.found,
                },
                {
                  where: {
                    phoneNumber: phoneNumber,
                  },
                }
              );
            } else {
              await db.usersTwilioCodes.create({
                code: code?.found,
                phoneNumber: phoneNumber,
              });
              // if( addedCode ){
              //     console.log("code added.")
              // } else {
              //     console.log("could not code.");
              //     res.send({ success: false, message: "could not add code." })
              // }
            }
            res
              .status(200)
              .send({
                success: true,
                message: "Verification Code is Sent on Your Number.",
              });
          } else {
            console.log("could not send message.");
            res.status(503).send({ success: false, message: "Server Error." });
          }
        } else if (code?.error) {
          console.log("Server Error.");
          res.send({ success: false, message: "Server Error." });
        } else {
          console.log("not found.");
          res.status(404).send({ success: false, message: "something bad." });
        }
      } else {
        console.log("already registerd.");
        res
          .status(200)
          .send({
            success: false,
            message: "This number is already registered.",
          });
      }
    } else {
      res.status(400).send({ success: false, message: "send a phone number." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

//on number register
exports.verifyOtpCode = async (req, res, next) => {
  try {
    let code = req.body.code;
    let phoneNumber = req.body.phoneNumber;
    if (code && phoneNumber) {
      let verifiedCode = await db.usersTwilioCodes.findOne({
        where: {
          code: code,
          phoneNumber: phoneNumber,
        },
      });
      if (verifiedCode) {
        res.status(200).send({ success: true, message: "Code Verified." });
      } else {
        res
          .status(401)
          .send({ success: false, message: "Code is Not Verified." });
      }
    } else {
      res.status(400).send({ success: false, message: "send proper data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

exports.registerUser = async (req, res, next) => {
  try {
    // let firstName = req.body.firstName.trim();
    // let lastName = req.body.lastName.trim();
    // let phoneNumber = req.body.phoneNumber.trim();
    // let password = req.body.password.trim();

    let { firstName, lastName, phoneNumber, password, code } = req?.body;
    let hashedPassword = bcrypt.hashSync(
      password,
      parseInt(process.env.BCRYPT_SALT)
    );
    if (firstName && lastName && phoneNumber && hashedPassword && code) {
      let existedNumber = await db.usersTwilioCodes.findAll({
        where: {
          phoneNumber,
          code,
        },
      });
      if (existedNumber?.length) {
        let userData = await db.users.create({
          firstName: firstName,
          lastName: lastName,
          password: hashedPassword,
          phoneNumber: phoneNumber,
        });
        if (userData) {
          console.log("userData", userData);
          await db.usersTwilioCodes.destroy({
            where: {
              phoneNumber: phoneNumber,
            },
          });
          res
            .status(200)
            .send({ success: true, message: "You Registered Successfully." });
        } else {
          req.send({ success: false, message: "Could Not Register." });
        }
      } else {
        console.log("Please register the number first.");
        res.send({ success: false, message: "Please Register the number." });
      }
    } else {
      console.log("Send proper data.");
      res.status(400).send({ success: false, message: "Send proper data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
    // error handling for unique validation.
    // let errorType = JSON.parse(JSON.stringify(err['errors']?.[0]))
    // if( errorType?.type === "unique violation" ){
    //     return { existed: true, message: "this user already exists." }
    // } else{
    //     console.log("error->", err)
    //     return { error: true, message: "Server Error." }
    // }
  }
};

exports.userLogin = async (req, res, next) => {
  try {
    const phoneNumber = req?.body?.phoneNumber?.trim?.();
    const password = req?.body?.password?.trim?.();
    console.log("in admin login");
    console.log(req.body);
    if (phoneNumber && password) {
      // let adminData = await admins.findAll();
      // console.log("adminData", adminData);
      let userData = await db.users.findOne({
        where: {
          phoneNumber: phoneNumber,
          isDeleted: false,
        },
        raw: true,
      });

      if (userData) {
        let hash = userData?.password;
        let result = bcrypt.compareSync(password, hash);
        console.log("hash", result);
        if (result) {
          console.log("logged in.", userData);
          let tokens = await createToken(userData);
          if (tokens?.error) {
            console.log("Server Error.");
            res.status(503).send({ success: false, message: "Server Error." });
          } else if (tokens?.not_created) {
            console.log("Data not found.");
            res.send({ success: false, message: "Something bad happened." });
          } else if (!tokens?.not_created && !tokens?.error) {
            res.status(200).send({
              success: true,
              data: {
                userId: userData?.id,
                phoneNumber: userData?.phoneNumber,
                firstName: userData?.firstName,
                lastName: userData?.lastName,
                tokens: tokens,
                ...userData,
              },
            });
          } else {
            // res.status(400).send("some error occured.")
            console.log("something other.");
          }
        } else {
          res
            .status(400)
            .send({ success: false, message: "Password is Incorrect." });
        }
      } else {
        res
          .status(400)
          .send({ success: false, message: "number does not exist." });
      }
    } else {
      console.log("email or password is missing.");
      res.status(400).send({ success: false, message: "send proper data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    let phoneNumber = req.body.phoneNumber;
    if (phoneNumber) {
      let code = await makeCode();
      let phoneNumberExists = await db.users.findOne({
        where: {
          phoneNumber,
        },
        raw: true,
      });
      if (phoneNumberExists) {
        if (code?.found) {
          let twilioMessage = await client.messages.create({
            body: "your verification code is " + code?.found,
            to: phoneNumber,
            from: process.env.TWILIO_NUMBER,
          });
          console.log("twilioMessage", twilioMessage);
          if (twilioMessage) {
            let existedCode = await db.usersTwilioCodes.findOne({
              where: {
                phoneNumber: phoneNumber,
              },
            });
            if (existedCode) {
              await db.usersTwilioCodes.update(
                {
                  code: code?.found,
                },
                {
                  where: {
                    phoneNumber: phoneNumber,
                  },
                }
              );
            } else {
              await db.usersTwilioCodes.create({
                code: code?.found,
                phoneNumber: phoneNumber,
              });
            }
            res
              .status(200)
              .send({
                success: true,
                message: "Verification Code is Sent on Your Number.",
              });
          } else {
            console.log("could not send message.");
            res.status(503).send({ success: false, message: "Server Error." });
          }
        } else if (code?.not_found) {
          console.log("no code are available.");
        } else if (code?.error) {
          console.log("Server Error.");
          res.status(503).send({ success: false, message: "Server Error." });
        }
      } else {
        console.log("this number does not exist.");
        res
          .status(401)
          .send({ success: false, message: "This number does not exist." });
      }
    } else {
      console.log("no phone number.");
      res.status(400).send({ success: false, message: "send a phone number." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

//on password reset
exports.verifyResetPasswordCode = async (req, res, next) => {
  try {
    let code = req.body.code;
    let phoneNumber = req.body.phoneNumber;
    if (code && phoneNumber) {
      let verifiedCode = await db.usersTwilioCodes.findOne({
        where: {
          code: code,
          phoneNumber: phoneNumber,
        },
      });
      if (verifiedCode) {
        res.status(200).send({ success: true, message: "code verified." });
      } else {
        res
          .status(400)
          .send({ success: false, message: "code is not verified." });
      }
    } else {
      res.status(400).send({ success: false, message: "send proper data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    let verificationCode = req?.body?.code;
    let phoneNumber = req.body?.phoneNumber;
    let password = req?.body?.password?.trim();
    let hashedPassword = bcrypt.hashSync(
      password,
      parseInt(process.env.BCRYPT_SALT)
    );
    if (verificationCode && phoneNumber && password) {
      let userData = await db.usersTwilioCodes.findOne({
        where: {
          code: verificationCode,
          phoneNumber: phoneNumber,
        },
        raw: true,
      });
      if (userData) {
        console.log("userData", userData);
        let updatedRows = await db.users.update(
          {
            password: hashedPassword,
          },
          {
            where: {
              phoneNumber: userData?.phoneNumber,
            },
          }
        );
        console.log("updatedRows", updatedRows);
        if (updatedRows[0] > 0) {
          await db.usersTwilioCodes.destroy({
            where: {
              code: verificationCode,
              phoneNumber: phoneNumber,
            },
          });
          res.status(200).send({ success: true, message: "Password Update." });
        } else {
          res.send({ success: false, message: "Could not Reset Password." });
        }
      } else {
        res
          .status(401)
          .send({ success: false, message: "This Code is not Valid." });
      }
    } else {
      console.log("Send Proper data.");
      res.status(400).send({ success: false, message: "Send Proper data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

exports.resendCode = async (req, res, next) => {
  try {
    let phoneNumber = req.body.phoneNumber;
    if (phoneNumber) {
      let code = await makeCode();
      let phoneNumberExists = await db.users.findOne({
        where: {
          phoneNumber,
        },
        raw: true,
      });
      if (phoneNumberExists) {
        if (code?.found) {
          let twilioMessage = await client.messages.create({
            body: "your verification code is " + code?.found,
            to: phoneNumber,
            from: process.env.TWILIO_NUMBER,
          });
          console.log("twilioMessage", twilioMessage);
          if (twilioMessage) {
            let existedCode = await db.usersTwilioCodes.findOne({
              where: {
                phoneNumber: phoneNumber,
              },
            });
            if (existedCode) {
              await db.usersTwilioCodes.update(
                {
                  code: code?.found,
                },
                {
                  where: {
                    phoneNumber: phoneNumber,
                  },
                }
              );
            } else {
              await db.usersTwilioCodes.create({
                code: code?.found,
                phoneNumber: phoneNumber,
              });
            }
            res
              .status(200)
              .send({
                success: true,
                message: "Verification Code is Sent on Your Number.",
              });
          } else {
            console.log("could not send message.");
            res.status(503).send({ success: false, message: "Server Error." });
          }
        } else if (code?.not_found) {
          console.log("no code are available.");
        } else if (code?.error) {
          console.log("Server Error.");
          res.status(503).send({ success: false, message: "Server Error." });
        }
      } else {
        console.log("This number does not exist.");
        res
          .status(404)
          .send({ success: false, message: "This number Does not exist." });
      }
    } else {
      console.log("send a phone number.");
      res.status(400).send({ success: false, message: "Send Proper data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

// update profile
exports.updateProfile = async (req, res) => {
  try {
    let userId = req.user_id;
    console.log("user", userId);
    let { profileImg, firstName, lastName } = req.body;
    console.log(profileImg, firstName, lastName, userId);
    if (userId && profileImg && firstName && lastName) {
      let updatedProfile = await db.users.update(
        {
          firstName,
          lastName,
          profileImg,
        },
        {
          where: {
            id: userId,
          },
        }
      );
      console.log("updatedProfile", updatedProfile);
      if (updatedProfile[0] > 0) {
        console.log("Profile Updated.");
        res.status(200).send({ success: true, message: "profile updated." });
      } else {
        console.log("could not update.");
        res.send({ success: false, message: "could not updated profile." });
      }
    } else {
      console.log("something is missing.");
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

// get my profile
exports.getProfile = async (req, res) => {
  try {
    let id = req.user_id;
    let userProfile = await db.users.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    console.log("userProfile", userProfile);
    if (userProfile) {
      res
        .status(200)
        .send({ success: true, message: "profile found.", data: userProfile });
    } else {
      res
        .status(200)
        .send({
          success: false,
          message: "data not found.",
          data: userProfile,
        });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

/***************** admin getting, updating and deleting user information ******************/

// get all users
exports.getUsers = async (req, res, next) => {
  try {
    let userId = req.params.id;
    if (userId === "all") {
      let usersData = await db.users.findAll({
        where: {
          isDeleted: false,
        },
        raw: true,
      });
      if (usersData?.length) {
        console.log("data found", usersData);
        res
          .status(200)
          .send({ success: true, message: "data found.", data: usersData });
      } else {
        console.log("data not found", usersData);
        res.status(404).send({ success: false, message: "data not found." });
      }
    } else if (userId) {
      let userData = await db.users.findOne({
        where: {
          id: userId,
          isDeleted: false,
        },
        raw: true,
      });
      if (userData) {
        console.log("data found", userData);
        res
          .status(200)
          .send({ success: true, message: "data found.", data: userData });
      } else {
        console.log("data not found", userData);
        res.status(404).send({ success: false, message: "data not found." });
      }
    } else {
      console.log("Invalid data.");
      res.send({ success: false, message: "Invalid Data." });
    }
  } catch (err) {
    console.log("error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

// delete user
exports.deleteUser = async (req, res, next) => {
  try {
    let userId = req.params.id;
    if (userId) {
      let deletedUser = await db.users.update(
        {
          isDeleted: true,
        },
        {
          where: {
            id: userId,
            isDeleted: false,
          },
        }
      );
      console.log("deletedUser", deletedUser[0]);
      if (deletedUser[0] > 0) {
        console.log("deletedUser", deletedUser);
        res
          .status(200)
          .send({ success: true, message: "Deleted Successfully." });
      } else {
        console.log("Not Deleted.");
        res.status(404).send({ success: false, message: "Data not found." });
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

// update user profile
exports.updateUserInfo = async (req, res, next) => {
  try {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let userId = req.body.userId;
    if (firstName && lastName) {
      let updatedUser = await db.users.update(
        {
          firstName: firstName,
          lastName: lastName,
        },
        {
          where: {
            id: userId,
            isDeleted: false,
          },
        }
      );
      console.log("updatedUser", updatedUser);
      if (updatedUser[0] > 0) {
        console.log("data found", updatedUser);
        res
          .status(200)
          .send({ success: true, message: "updated user information." });
      } else {
        console.log("Data not found.");
        res.status(404).send({ success: false, message: "data not found." });
      }
    } else {
      console.log("somthing is missing.");
      res.status(400).send({ success: false, message: "Send Proper Data." });
    }
  } catch (err) {
    console.log("Error", err);
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

//user add new restaurnats
exports.addNewRestaurant = async (req, res) => {
  try {
    const {stateId, cityId,location, restaurantName} = req.body;
    if (stateId && cityId && restaurantName && location) {
        let createdBy = req?.user_id;
        let restaurantLogo = req?.body?.logo?.trim() ?? null;
        let restuarantImgs = req?.body?.imgs?.map((value, index) => {
          return { [index]: value };
        });
        let addedRestaurants = await db.restaurants.create({
          restaurantName: restaurantName?.trim(),
          logo: restaurantLogo,
          img: { imgs: restuarantImgs },
          cityId: cityId,
          location: location.trim(),
          addeddBy:createdBy,
        });
        if (addedRestaurants?.dataValues) {
          res.status(200).send({ success: true, message: "Restaurant Added." });
        } else {
          res.status(400).send({ success: false, message: "Could not Add Restaurants." });
        }
      
    }else{
        res.status(400).send({ success: false, message: "Send Proper Data." });
    }

  } catch (error) {
    res.status(503).send({ success: false, message: "Internal Server Error." });
  }
};

//user searc city
exports.searchCity = async (req, res) => {
  try {
    console.log(req.body)
    const Op = Sequelize.Op;
    let cityName = req?.body?.cityName?.trim();
    let result = "";
    result = await db.cities.findAll({
      where: {
        cityName: { [Op.like]: `%${cityName}%` },
      },
      raw: true,
    });
    if (result?.length>0) {
        res.status(200).send({ success: true, message: "Cities Found.",cities:result });
      } else {
        res
          .status(400)
          .send({ success: false, message: "No City found." });
      }
  } catch (error) {
    res.status(503).send({ success: false, message: "Server Error." });
  }
};

//user add city
exports.addCity = async (req, res) => {
  try {
    let { cityName, cityImg,stateId } = req?.body;
    let userId =req?.user_id;
    if (cityName && cityImg) {
      let addedCity = await db.cities.create({
        cityName: cityName,
        cityImg: cityImg,
        stateId: stateId,
        createdBy: userId,
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

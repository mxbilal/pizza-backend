const express = require('express');
const router = express.Router();
const checkOut = require('../app/stripe/checkOut');
const adminpayout = require('../app/controllers/AdminPayout.js');
const userReservation = require('../app/stripe/addReservation');
const sellReservation = require('../app/stripe/sellReservation');
var { uploadImage } = require('../app/uploadCards/uploadImage');
const userController = require('../app/controllers/userController');
const commonFunctions = require('../app/controllers/commonFunctions');
// const AuthController = require('../app/controllers/AuthController');
const bookingsController = require('../app/controllers/bookingsController');
const adminAuthController = require('../app/controllers/adminAuthController');
const reservationsController = require("../app/controllers/reservationsController");
const connectedAccount = require('../app/stripe/connectedAccount');

const user = '/user'
const admin= '/admin'

// router.post('/login', AuthController.login);
// router.post('/logout', AuthController.logout);
// router.post('/sign-up', AuthController.signUp);
// router.post('/forgot-password', AuthController.forgotPassword);

// for upload image
router.use('/image', commonFunctions.verifyToken);
router.post('/image', uploadImage.single("img"), async(req, res) => {
    try{
        if(!req.fileValidationError){
            console.log("image", req?.file?.filename)
            let fileUrl = req?.file?.filename;
            res.status(200).send({ img_url: fileUrl })
        } else{
            console.log("error")
        }
    } catch(err){
        console.log('error', err);
        res.status(503).send({ success: false, message: 'Internal Server Error.' })
    }
})


//verify access token expiration
router.get('/check/expiration', commonFunctions.verifyExpiration)

//for getting all cities/single city
// router.use('/cities', commonFunctions.verifyToken);
router.get('/states',commonFunctions.getAllStates);
// router.use('/cities/:id', commonFunctions.verifyToken);
router.get('/cities/:id/:page', commonFunctions.getAllCities);
router.get('/cities/state/:id/:page', commonFunctions.getAllCitiesByState);
// router.use('/restaurants/:id', commonFunctions.verifyToken);


// get restaurants using city id
router.use('/restaurants/:id', commonFunctions.verifyToken);
router.get('/restaurants/:id', commonFunctions.getRestaurants);

// get single restaurant using restaurant Id
router.use('/restaurant/:id', commonFunctions.verifyToken);
router.get('/restaurant/:id', commonFunctions.getRestaurant)

// get reservations of particular resturant
router.use('/reservations/:id', commonFunctions.verifyToken);
router.get('/reservations/:id', commonFunctions.getAllReservations)






// // admin routers
router.post(admin+'/login', adminAuthController.login);


/************ **************/
router.post(admin+'/resetpassword', adminAuthController.resetPassword);



/************ **************/
router.post(admin+'/verifycode', adminAuthController.verifyCode);

/************ **************/
router.post(admin+'/resendcode', adminAuthController.resendCode);

/************ **************/
// router.use(admin+'/updatepassword', commonFunctions.verifyToken);
router.put(admin+'/updatepassword', adminAuthController.updatePassword);

//for adding city information apis
/************ **************/
router.use(admin+'/city', commonFunctions.verifyToken);
router.post(admin+'/city', adminAuthController.addCity);

/************ **************/
router.use(admin+'/city', commonFunctions.verifyToken);
router.put(admin+'/city', adminAuthController.updateCity);

/************ **************/
router.use(admin+'/city/:id', commonFunctions.verifyToken);
router.delete(admin+'/city/:id', adminAuthController.deleteCity);

//for adding restaurants information

/************ **************/
router.use(admin+'/restaurant', commonFunctions.verifyToken);
router.post(admin+'/restaurant', adminAuthController.addRestaurant);

/************ **************/
router.use(admin+'/restaurant', commonFunctions.verifyToken);
router.put(admin+'/restaurant', adminAuthController.updateRestaurant);

/************ **************/
router.use(admin+'/restaurant/:id', commonFunctions.verifyToken);
router.delete(admin+'/restaurant/:id', adminAuthController.deleteRestaurant);

// generate code for adding restaurant reservations
/************ **************/
router.use('/reservation/code', commonFunctions.verifyToken);
router.get('/reservation/code', reservationsController.generateCode);

// admin routers for getting all payouts
router.get(admin+'/payoutRequests', adminpayout.getAllPayoutRequest);

// admin routers for getting all payouts
// router.use(admin+'/payoutsuccess', commonFunctions.payoutSuccess);
router.post(admin+'/payoutsuccess', adminpayout.payoutSuccess);

// add reservations

/************ **************/
router.use(admin+'/reservation', commonFunctions.verifyToken);
router.post(admin+'/reservation', reservationsController.addReservations);

// update reservation, it only updates available reservations.

/************ **************/
// router.use(admin+'/reservation', commonFunctions.verifyToken);
router.put(admin+'/reservation', reservationsController.updateReservations);


//get all/single the reservations, it only inlcudes sold and available reservation
/************ **************/
router.use(admin+'/reservation/:id', commonFunctions.verifyToken);
router.get(admin+'/reservation/:id', reservationsController.getReservations);

// delete reservations
/************ **************/
router.use(admin+'/reservation/:id', commonFunctions.verifyToken);
router.delete(admin+'/reservation/:id', reservationsController.deleteReservations);

// get reservations of a user
/************ **************/
router.use(admin+'/user/reservations/:id', commonFunctions.verifyToken);
router.get(admin+'/user/reservations/:id', bookingsController.getUserReservations)






// get all users/single user
/************ **************/
router.use(admin+'/users/:id', commonFunctions.verifyToken);
router.get(admin+'/users/:id', userController.getUsers);

// delete user
/************ **************/
router.use(admin+'/user/:id', commonFunctions.verifyToken);
router.delete(admin+'/user/:id', userController.deleteUser);

// update user information
/************ **************/
router.use(admin+'/user', commonFunctions.verifyToken);
router.put(admin+'/user', userController.updateUserInfo)
// router.get('/admin/city', adminAuthController.getAllCities)





//user routes
// register user phone number
router.post(user+'/phone/register', userController.registerNumber);

// verify code
router.post(user+'/verify/code', userController.verifyOtpCode);

// signup user
router.post(user+'/register', userController.registerUser);

// login user
router.post(user+'/login', userController.userLogin);

// reset password for user
router.post(user+'/resetpassword', userController.resetPassword);

// update password for user
router.put(user+'/password', userController.updatePassword);

// resend twilio code
router.post(user+'/resendcode', userController.resendCode);

// stripeaccountlink
router.post(user+'/stripeaccountlink', connectedAccount.getStripeAccount);

// transfer to stripe connected account
router.post(user+'/transfer', connectedAccount.createTransfer);


//user add new city and resturant
router.use(user+'/addnewrestaurant', commonFunctions.verifyToken);
router.post(user+'/addnewrestaurant', userController.addNewRestaurant);

//user search city
router.post(user+'/searchcity', userController.searchCity);

//for adding city information apis
/************ **************/
router.use(user+'/city', commonFunctions.verifyToken);
router.post(user+'/city', userController.addCity);


//user Edit reservation
router.use(user+'/editreservations', commonFunctions.verifyToken);
router.put(user+'/editreservations',reservationsController.editReservations);

//user delete reservation
// router.use(user+'/deletereservation/:id', commonFunctions.verifyToken);
router.delete(user+'/deletereservation/:id',reservationsController.userDeleteReservations);

// user add booking
// router.post(user+'/booking', bookingsController.addBookings);

// get user reservation/ bookings
/************ **************/
router.use(user+'/booking', commonFunctions.verifyToken);
router.get(user+'/booking', bookingsController.getMyReservations);

// get user getPurchasedReservations/ bookings
/************ **************/
router.use(user+'/purchasedreservations', commonFunctions.verifyToken);
router.get(user+'/purchasedreservations', bookingsController.getPurchasedReservations);

// get Total earning of a user
/************ **************/
router.use(user+'/gettotalearnings', commonFunctions.verifyToken);
router.get(user+'/gettotalearnings', bookingsController.getTotalEarnings)

// sell reservation that user purchased
/************ **************/
router.use(user+'/sellPurchasedReservation', commonFunctions.verifyToken);
router.post(user+'/sellPurchasedReservation',sellReservation.sellPurchasedReservation)
router.get(user+'/sellReservation', sellReservation.sellReservations);  


// Add reservation from user with payment
/************ **************/
router.use(user+'/adduserreservations', commonFunctions.verifyToken);
router.post(user+'/adduserreservations',userReservation.createReservation)
router.get(user+'/reservationbyuser', userReservation.addUserReservations); 

// filter reservations based on price and seats
/************ **************/
router.use(user+'/filter/reservations', commonFunctions.verifyToken);
router.post(user+'/filter/reservations', reservationsController.filterReservations);

// filter reservations based on date
/************ **************/
router.use(user+'/date/filter/reservations', commonFunctions.verifyToken);
router.post(user+'/date/filter/reservations', reservationsController.filterDateReservations)

// user update profile
router.use(user+'/update/profile', commonFunctions.verifyToken);
router.put(user+'/update/profile', userController.updateProfile);

// get user profile
router.use(`${user}/profile`, commonFunctions.verifyToken);
router.get(`${user}/profile`, userController.getProfile)

// user checkout for reservations
router.use(user+'/checkout', commonFunctions.verifyToken);
router.post(user+'/checkout', checkOut.startCheckOut);

// on successfull checkout url
/************ **************/
router.get(user+'/success/checkout', checkOut.successCheckOut);

// on some error or cancel
router.post(user+'/cancel/checkout', checkOut.cancelCheckOut);


// get reservations and restauratns of a city
/************ **************/
router.use(`${user}/reservatiosn/:cityId`, commonFunctions.verifyToken);
router.get(`${user}/reservatiosn/:cityId`, reservationsController.cityReservations)


// router.post('/admin/logout', AdminAuthController.logout);
// router.post('/admin/sign-up', AdminAuthController.signUp);
// router.post('/admin/forgot-password', AdminAuthController.forgotPassword);



//default route if no route matches
router.get("*", (req, res) => {
    res.send("route does not match any.");
});

router.post("*", (req, res) => {
    res.send("route does not match any.");
});

router.put("*", (req, res) => {
    res.send("route does not match any.");
});

router.delete("*", (req, res) => {
    res.send("route does not match any.");
});
module.exports = router;

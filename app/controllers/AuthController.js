const bcrypt = require('bcryptjs');
const validator = require('validator');
const User = require('../models/User');
const userSession = require('../models/UserSession');
const jwt = require('jsonwebtoken');

const message = (req) => {
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}

	return message;
};

const oldInput = (req) => {
	let oldInput = req.flash('oldInput');
	if (oldInput.length > 0) {
		oldInput = oldInput[0];
	} else {
		oldInput = null;
	}

	return oldInput;
};

const createToken = async (user) => {
	const token = jwt.sign({ id: user.id }, process.env.JWT_TOKEN_KEY, {
		expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
	});
	const session = await new userSession({
		userId: user.id,
		accessToken: token,
	});
	if (session) {
		var sessionSaved = await session
			.save()
			.then(() => {
				user.dataValues.accessToken = token;
				return user;
			})
			.catch((err) => {
				console.log('err while creating session', err);
				return -1;
			});
		return sessionSaved;
	}
	// save user token
};
exports.login = (req, res, next) => {
	const validationErrors = [];
	const { email, password } = req.body;
	if (password && email) {
		if (!validator.isEmail(email)) {
			validationErrors.push('Please enter a valid email address.');
		}
		if (validator.isEmpty(password)) {
			validationErrors.push('Password cannot be blank.');
		}
	} else {
		validationErrors.push('Email and Password are required.');
	}
	if (validationErrors.length) {
		res.status(400).send({
			success: false,
			message: 'Issue in data which is being send',
			data: validationErrors,
		});
	}
	User.findOne({
		where: {
			email: email,
		},
	})
		.then((user) => {
			if (user) {
				bcrypt
					.compare(password, user.password)
					.then(async (doMatch) => {
						if (doMatch) {
							//req.session.isLoggedIn = true;
							//req.session.user = user.dataValues;
							//return req.session.save((err) => {
							//	console.log(err);
							var updatedUserObj = await createToken(user);
							if (updatedUserObj != -1 && updatedUserObj) {
								res.status(200).send({
									success: true,
									message: 'Successful login',
									data: updatedUserObj,
								});
							} else {
								res.status(400).send({
									success: false,
									message: 'failed to create session token',
								});
							}
							//});
						}
						res.status(400).send({
							success: false,
							message: 'Invalid email or password',
						});
					})
					.catch((err) => {
						console.log(err);
						res.status(400).send({
							success: false,
							message: 'Sorry! Somethig went wrong.',
						});
					});
			} else {
				res.status(400).send({
					success: false,
					message: 'No user found with this email.',
				});
			}
		})
		.catch((err) => console.log(err));
};

exports.logout = (req, res, next) => {
	const validationErrors = [];
	const { userId } = req.body;
	if (validator.isEmpty(userId)) {
		validationErrors.push('userId is required.');
	}
	if (validationErrors.length) {
		res.status(400).send({
			success: false,
			message: 'Issue in data which is being send',
			data: validationErrors,
		});
	}
	userSession
		.findOne({
			where: {
				userId,
			},
		})
		.then((session) => {
			if (!session) {
				res.status(400).send({
					success: false,
					message: 'No session found against the userId',
				});
			} else {
				session.destroy();
				res.status(200).send({
					success: true,
					message: 'Logout successful',
				});
			}
		})
		.catch((err) => {
			console.log(err);
			res.status(400).send({
				success: false,
				message: err,
			});
		});
};

exports.signUp = (req, res, next) => {
	const validationErrors = [];
	const { firstName, lastName, email, password } = req.body;
	if (password && firstName && lastName && email) {
		if (
			validator.isEmpty(password) ||
			validator.isEmpty(firstName) ||
			validator.isEmpty(lastName)
		) {
			validationErrors.push(
				'Email, First name, Last name  and Password are required.'
			);
		}
	} else {
		if (!validator.isEmail(email)) {
			validationErrors.push('Please enter a valid email address.');
		}
	}
	if (validationErrors.length) {
		res.status(400).send({
			success: false,
			message: 'Issue with data being send',
			data: validationErrors,
		});
	}
	User.findOne({
		where: {
			email: email,
		},
	})
		.then((user) => {
			if (!user) {
				bcrypt.hash(password, 12).then(async (hashedPassword) => {
					const user = new User({
						email,
						firstName,
						lastName,
						password: hashedPassword,
					});
					user
						.save()
						.then((data) => {
							res.status(200).send({
								success: true,
								message: 'User Created =)',
								data: data,
							});
						})
						.catch((err) => {
							res.status(400).send({
								success: false,
								message: err,
							});
						});
				});
			} else {
				res.status(400).send({
					success: false,
					message: 'E-Mail exists already, please pick a different one.',
				});
			}
		})
		.catch((err) => console.log(err));
};

exports.forgotPassword = (req, res, next) => {
	const validationErrors = [];
	const { email, password } = req.body;

	if (!validator.isEmail(email)) {
		validationErrors.push('Please enter a valid email address.');
	}
	if (validationErrors.length) {
		res.status(400).send({
			success: false,
			message: 'Issue with data being send',
			data: validationErrors,
		});
	}
	// crypto.randomBytes(32, (err, buffer) => {
	// 	if (err) {
	// 		console.log(err);
	// 		// return res.redirect('/forgot-password');
	// 	}
	// 	const token = buffer.toString('hex');
	User.findOne({
		where: {
			email: email,
		},
	})
		.then(async (user) => {
			if (!user) {
				res.status(400).send({
					success: false,
					message: 'No user found with this email.',
				});
			} else {
				var hashedPassword = await bcrypt.hash(password, 12);
				console.log('hashedPassword', hashedPassword);
				user
					.update({
						password: hashedPassword,
					})
					.then((result) => {
						console.log(result);
						res.status(200).send({
							success: true,
							message: 'Password updated successfully',
						});
					})
					.catch((err) => {
						res.status(400).send({
							success: false,
							message: 'Failed to update password successfully',
						});
					});
			}
			// user.resetToken = token;
			// user.resetTokenExpiry = Date.now() + 3600000;
			// return user.save();
		})

		.catch((err) => {
			console.log(err);
		});
	//});
};

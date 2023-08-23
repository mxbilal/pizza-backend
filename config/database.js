const env = require('dotenv');
env.config();

module.exports = {
	HOST: process.env.DB_HOST,
	USER: process.env.DB_USERNAME,
	PASSWORD: process.env.DB_PASSWORD,
	DB: process.env.DB_DATABASE,
	dialect: "mysql",
	pool: {
		//pool configuration
		max: 5,//maximum number of connection in pool
		min: 0,//minimum number of connection in pool
		acquire: 30000,//maximum time in ms that pool will try to get connection before throwing error
		idle: 1000000//maximum time in ms, that a connection can be idle before being released
	}
};
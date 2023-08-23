const databaseConfig = require("../../config/database");
const Sequelize = require("sequelize");
const { request } = require("http");
const sequelizeInstance = new Sequelize(databaseConfig.DB, databaseConfig.USER, databaseConfig.PASSWORD, {
  host: databaseConfig.HOST,
  port: 3306,
  dialect: databaseConfig.dialect,
  operatorsAliases: 0,

  pool: {
    max: databaseConfig.pool.max,
    min: databaseConfig.pool.min,
    acquire: databaseConfig.pool.acquire,
    idle: databaseConfig.pool.idle
  }
});
const db = {};

db.users = require("./user")(sequelizeInstance, Sequelize);
db.states = require("./states")(sequelizeInstance, Sequelize);
db.admins = require("./Admin")(sequelizeInstance, Sequelize);
db.cities = require("./cities")(sequelizeInstance, Sequelize);
db.bookings = require("./bookings")(sequelizeInstance, Sequelize);
db.restaurants = require("./restaurants")(sequelizeInstance, Sequelize);
db.reservations = require("./reservations")(sequelizeInstance, Sequelize);
db.adminSessions = require("./adminSession")(sequelizeInstance, Sequelize);
db.usersSessions = require("./usersSessions")(sequelizeInstance, Sequelize);
db.adminResetCodes = require("./adminResetCode")(sequelizeInstance, Sequelize);
db.usersTwilioCodes = require("./usersTwilioCodes")(sequelizeInstance, Sequelize);
// db.restaurantsLocations = require("./restaurantLocation")(sequelizeInstance, Sequelize);

/**************** relationships ***************/
db.admins.hasMany(db.adminSessions, { foreignKey: "userId", });
db.adminSessions.belongsTo(db.admins, { foreignKey: "userId", })

db.admins.hasOne(db.adminResetCodes, { foreignKey: "userId", });
db.adminResetCodes.belongsTo(db.admins, { foreignKey: "userId", })

db.users.hasMany(db.usersSessions, { foreignKey: "userId", });
db.usersSessions.belongsTo(db.users, { foreignKey: "userId", })

/*************** relationship between cities and admin ****************/

db.admins.hasMany(db.cities, { foreignKey: 'createdBy' });
db.cities.belongsTo(db.admins, { foreignKey: 'createdBy' });

/***************** relationship between cities and restaurants ********/

db.cities.hasMany(db.restaurants, { foreignKey: 'cityId' });
db.restaurants.belongsTo(db.cities, { foreignKey: 'cityId' });

/*********** relationship between restaurants and admin ***************/

db.admins.hasMany(db.restaurants, { foreignKey: 'createdBy' });
db.restaurants.belongsTo(db.admins, { foreignKey: 'createdBy' });


/****relationship between restaurants and restaurantLocations table ***/

// db.restaurants.hasMany(db.restaurantsLocations, { foreignKey: 'restaurantId' });
// db.restaurantsLocations.belongsTo(db.restaurants, { foreignKey: 'restaurantId' })


/************** relationships between restaurants and reservations ***************/
db.restaurants.hasMany(db.reservations, { foreignKey: "restaurantId" })
db.reservations.belongsTo(db.restaurants, { foreignKey: "restaurantId" })

db.states.hasMany(db.cities, { foreignKey: "stateId" });
db.cities.belongsTo(db.states);


/************** relatinship between admin and reservations **********/
db.admins.hasMany(db.reservations, { foreignKey: "createdBy" });
db.reservations.belongsTo(db.admins, { foreignKey: "createdBy" });

/************ relationships between reservations and bookings tables ***************/
db.reservations.hasOne( db.bookings, { foreignKey: "reservationId" });
db.bookings.belongsTo(db.reservations, { foreignKey: "reservationId" });


/***************** relationship between users and booking table ******************/
db.users.hasMany(db.bookings, { foreignKey: "userId" });
db.bookings.belongsTo(db.users, { foreignKey: "userId" })



/************************ *********************/
db.Sequelize = Sequelize;
db.sequelize = sequelizeInstance;




/****************************************** */
module.exports = db;

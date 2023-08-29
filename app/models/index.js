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
db.admins = require("./Admin")(sequelizeInstance, Sequelize);
db.adminSessions = require("./adminSession")(sequelizeInstance, Sequelize);
db.usersSessions = require("./usersSessions")(sequelizeInstance, Sequelize);
db.adminResetCodes = require("./adminResetCode")(sequelizeInstance, Sequelize);
db.usersTwilioCodes = require("./usersTwilioCodes")(sequelizeInstance, Sequelize);
db.products = require("./Products")(sequelizeInstance, Sequelize);
db.categories = require("./category")(sequelizeInstance, Sequelize);











db.products.hasMany(db.categories, { foreignKey: "productId" });
db.categories.belongsTo(db.products, { foreignKey: "productId" });


/************************ *********************/
db.Sequelize = Sequelize;
db.sequelize = sequelizeInstance;




/****************************************** */
module.exports = db;

// const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../../config/database');
module.exports = (sequelize, Sequelize) => {
    const usersSessions = sequelize.define(
        'usersSessions',
        {
			refreshToken: Sequelize.STRING
        },
    );
    return usersSessions
}
// const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../../config/database');
module.exports = (sequelize, Sequelize) => {
    const cities = sequelize.define(
        'cities',
        {
            stateId:Sequelize.INTEGER,
            cityName: Sequelize.STRING,
            cityImg: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            isDeleted:{
                type: Sequelize.STRING,
                defaultValue: false,
            }
        },
    );
    return cities
}

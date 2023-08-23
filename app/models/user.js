// const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../../config/database');
module.exports = (sequelize, Sequelize) => {
    const users = sequelize.define(
        'users',
        {
            firstName: Sequelize.STRING,
            lastName: Sequelize.STRING,
            password: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            profileImg:{
                type: Sequelize.STRING
            },
			phoneNumber: {
				type: Sequelize.STRING,
                allowNull: true
			},
            isDeleted: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            accountId:{
                type: Sequelize.STRING,
                allowNull: true
            }
        },
        // {
        //     indexes: [
        //         // Create a unique index on email
        //         {
        //             unique: true,
        //             fields: ['phoneNumber'],
        //         },
        //     ],
        // }
    );
    return users
}

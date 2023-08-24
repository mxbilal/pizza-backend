// const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../../config/database');
module.exports = (sequelize, Sequelize) => {
    const adminUsers = sequelize.define(
        'admins',
        {
            firstName: Sequelize.STRING,
            lastName: Sequelize.STRING,
            email: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            profileImage: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            adminType: {
                type: Sequelize.ENUM("super_admin", "admin"),
                defaultValue: "admin"
            }
        },
        {
            indexes: [
                // Create a unique index on email
                {
                    unique: true,
                    fields: ['email'],
                },
            ],
        }
    );
    return adminUsers
}

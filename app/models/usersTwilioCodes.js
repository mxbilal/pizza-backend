module.exports = (sequelize, Sequelize) => {
    const usersTwilioCodes = sequelize.define(
        'usersTwilioCodes',
        {
            code: Sequelize.STRING,
            phoneNumber: {
                type: Sequelize.STRING
            }
        },

    );
    return usersTwilioCodes
}
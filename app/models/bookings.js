module.exports = (sequelize, Sequelize) => {
    const bookings = sequelize.define(
        'bookings',
        {
            status:{
                type: Sequelize.STRING,
            },
            amount: {
                type: Sequelize.STRING
            },
            userAccount: {
                type: Sequelize.STRING
            },
            payoutStatus: {
                type: Sequelize.STRING
            },
            payoutReferenceId: {
                type: Sequelize.STRING
            },
            transactionId: {
                type: Sequelize.STRING
            }
        },
    );
    return bookings
}
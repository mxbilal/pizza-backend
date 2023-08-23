module.exports = (sequelize, Sequelize) => {
    const adminResetCodes = sequelize.define(
        'adminResetCodes',
        {
            resetCode: Sequelize.STRING
        },
    );
    return adminResetCodes
}
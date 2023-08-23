module.exports = (sequelize, Sequelize) => {
    const adminSessions = sequelize.define(
        'adminSessions',
        {
            refreshToken: Sequelize.STRING
        },
    );
    return adminSessions
}
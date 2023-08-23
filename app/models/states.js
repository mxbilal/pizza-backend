module.exports = (sequelize, Sequelize) => {
    const states = sequelize.define("states", {
        stateName: Sequelize.STRING
    });
    return states;
};
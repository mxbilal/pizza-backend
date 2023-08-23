module.exports = (sequelize, Sequelize) => {
    const restaurantsLocations = sequelize.define(
        'restaurantsLocations',
        {
            location: {
                type: Sequelize.STRING
            },
            isDeleted:{
                type: Sequelize.STRING,
                defaultValue: false,
            }
        },
    );
    return restaurantsLocations
}

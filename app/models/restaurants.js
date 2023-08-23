module.exports = (sequelize, Sequelize) => {
    const restaurants = sequelize.define(
        'restaurants',
        {
            restaurantName: Sequelize.STRING,
            addeddBy: Sequelize.INTEGER,
            logo: {
                type: Sequelize.STRING,
                allowNull: true
            },
            img: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            location: {
                type: Sequelize.STRING
            },
            isDeleted:{
                type: Sequelize.STRING,
                defaultValue: false,
            },
            cityId:Sequelize.INTEGER,
        },
    );
    return restaurants
}

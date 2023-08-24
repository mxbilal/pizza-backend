module.exports = (sequelize, Sequelize) => {
  const products = sequelize.define("products", 
    {
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    }
  );
  return products;
};

module.exports = (sequelize, Sequelize) => {
  const categories = sequelize.define("categories", 
    {
      type: {
        type: Sequelize.ENUM("small", "medium", "large"),
        defaultValue: "small"
      },
      prize: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      images: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    }
  );
  return categories;
};

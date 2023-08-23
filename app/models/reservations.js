module.exports = (sequelize, Sequelize) => {
  const reservations = sequelize.define("reservations", {
    status: {
      type: Sequelize.STRING,
      defaultValue: "available",
    },
    code: {
      type: Sequelize.STRING,
    },
    price: {
      type: Sequelize.STRING,
    },
    date: {
      type: Sequelize.STRING,
    },
    time: {
      type: Sequelize.STRING,
    },
    seats: {
      type: Sequelize.STRING,
    },
    userAccount: {
      type: Sequelize.STRING,
    },
    payoutStatus: {
      type: Sequelize.STRING,
    },
    payoutReferenceId: {
      type: Sequelize.STRING,
    },
  });
  return reservations;
};

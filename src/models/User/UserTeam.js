export default (sequelize, DataTypes) => {
  const UserTeam = sequelize.define('userTeam', {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return UserTeam;
};

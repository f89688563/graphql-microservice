import bcrypt from 'bcrypt';

export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    'user',
    {
      username: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          isAlphanumeric: {
            args: true,
            msg: 'The username can only contain letters and numbers',
          },
          len: {
            args: [3, 25],
            msg: 'The username needs to be between 3 and 25 characters long',
          },
        },
      },
      phoneNumber: {
        type: DataTypes.STRING,
        field: 'phone_number',
        unique: true,
        validate: {
          len: {
            args: [11],
            msg: 'The phoneNumber needs to be 11 characters long',
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          isEmail: {
            args: true,
            msg: 'Invalid email',
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        validate: {
          len: {
            args: [5, 100],
            msg: 'The password needs to be between 5 and 100 characters long',
          },
        },
      },
      gender: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
    },
    {
      hooks: {
        afterValidate: async (user) => {
          const hashedPassword = await bcrypt.hash(user.password, 12);
          // eslint-disable-next-line no-param-reassign
          user.password = hashedPassword;
        },
      },
    },
  );

  User.associate = (models) => {
    User.belongsToMany(models.Team, {
      through: models.UserTeam,
      foreignKey: {
        name: 'userId',
        field: 'user_id',
      },
    });
  };

  return User;
};

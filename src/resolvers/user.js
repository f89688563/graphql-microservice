import { tryLogin } from '../auth';
import formatErrors from '../formatErrors';

export default {
  User: {
    teams: ({ id }, args, { models }) =>
      models.sequelize.query(
        `select * from ${models.Team.getTableName()} as team join ${models.UserTeam.getTableName()} as ut on team.id = ut.team_id where ut.user_id = ?`,
        {
          replacements: [id],
          model: models.Team,
          raw: true,
        },
      ),
  },
  Query: {
    user: (parent, { id }, { models }) => models.User.findById(id),
    users: (parent, args, { models }) => models.User.findAll({ where: args }),
  },
  Mutation: {
    login: (parent, { email, password }, { models, SECRET, SECRET2 }) =>
      tryLogin(email, password, models, SECRET, SECRET2),
    // login: (parent, { email, password }, { models, SECRET, SECRET2 }) =>
    //   tryLogin(email, password, models, SECRET, SECRET2),
    register: async (parent, args, { models }) => {
      // let user
      // models.sequelize.transaction(
      //   { autocommit: true, isolationLevel: models.Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
      //   () => {
      //     return Promise.all([
      const user = await models.User.create(args);
      const team = await models.Team.create({ name: args.phoneNumber });
          // ]).then(() => {
          //   throw new Error('....');
          // });
      // if (team) throw new Error('create error...');
      // })
      return {
        ok: true,
        user,
      };
      // try {
      //   const user = await models.User.create(args);
      //
      //   return {
      //     ok: true,
      //     user,
      //   };
      // } catch (err) {
      //   return {
      //     ok: false,
      //     errors: formatErrors(err, models),
      //   };
      // }
    },
  },
};

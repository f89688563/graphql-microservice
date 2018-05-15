import { withFilter } from 'graphql-subscriptions';

import formatErrors from '../formatErrors';
import pubsub from '../pubsub';

const NEW_TEAM_MESSAGE = 'NEW_TEAM_MESSAGE'

export default {
  Query: {
    getTeamMembers: async (parent, { teamId }, { models }) =>
      models.sequelize.query(
        `select * from ${models.User.getTableName()} as u join ${models.UserTeam.getTableName()} as m on m.user_id = u.id where m.team_id = ?`,
        {
          replacements: [teamId],
          model: models.User,
          raw: true,
        },
      ),
  },
  Mutation: {
    addTeam: async (parent, args, { models, user }) => {
      try {
        const response = await models.sequelize.transaction(async (transaction) => {
          const team = await models.Team.create({ ...args }, { transaction });
          // await models.UserTeam.create(
          //   { teamId: team.id, userId: user.id, admin: true },
          //   { transaction },
          // );

          pubsub.publish(NEW_TEAM_MESSAGE, {
            [NEW_TEAM_MESSAGE]: team,
          });

          return team;
        });
        return {
          ok: true,
          team: response,
        };
      } catch (err) {
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    },
  },
  Team: {
    users: ({ id }, args, { models }) =>
      models.sequelize.query(
        `select u.* from ${models.User.getTableName()} as u join ${models.UserTeam.getTableName()} as m on u.id = m.user_id where :teamId = m.team_id`,
        {
          replacements: { teamId: id },
          model: models.User,
          raw: true,
        },
      ),
  },
  Subscription: {
    newTeamMessage: {
      resolve: payload => {
        console.log(111);
        return payload[NEW_TEAM_MESSAGE];
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator(NEW_TEAM_MESSAGE),
        (payload, variables) => variables.name === 'test',
      ),
    },
  },
};

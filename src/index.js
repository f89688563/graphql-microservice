import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
// import DataLoader from 'dataloader';

import getModels from './models';
import { refreshTokens } from './auth';
import { PORT } from './config';
import buildSchema from './schema';

const SECRET = 'asiodfhoi1hoi23jnl1kejd';
const SECRET2 = 'asiodfhoi1hoi23jnl1kejasdjlkfasdd';

const app = express();
const graphqlEndpoint = '/graphql';
const server = createServer(app);

getModels().then((models) => {
  if (!models) {
    console.log('Could not connect to database');
    return;
  }

  const schema = buildSchema(models.sequelize);

  function parseCookies(request) {
    const list = {}
    const rc = request.headers.cookie

    if (rc) {
      rc.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
      });
    }
    return list;
  }

  const addUser = async (req, res, next) => {
    const token = req.headers['x-token'] || parseCookies(req)['x-token'];
    if (token) {
      try {
        const { user } = jwt.verify(token, SECRET);
        req.user = user;
      } catch (err) {
        const refreshToken = req.headers['x-refresh-token'];
        const newTokens = await refreshTokens(token, refreshToken, models, SECRET, SECRET2);
        if (newTokens.token && newTokens.refreshToken) {
          res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
          res.set('x-token', newTokens.token);
          res.set('x-refresh-token', newTokens.refreshToken);
        }
        req.user = newTokens.user;
      }
    }
    next();
  };

  app.use(cors('*'));
  app.use(addUser);

  app.use(
    graphqlEndpoint,
    bodyParser.json(),
    graphqlExpress((req) => {
      // console.log('req', req.body)
      return {
        schema,
        context: {
          models,
          user: req.user,
          SECRET,
          SECRET2,
          serverUrl: `${req.protocol}://${req.get('host')}`,
        },
      };
    }),
  );

  app.use(
    '/graphiql',
    graphiqlExpress({
      endpointURL: graphqlEndpoint,
      subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
    }),
  );

  models.sequelize.sync({}).then(() => {
    server.listen(PORT, () => {
      // eslint-disable-next-line no-new
      new SubscriptionServer(
        {
          execute,
          subscribe,
          schema,
          onConnect: async ({ token, refreshToken }) => {
            if (token && refreshToken) {
              try {
                const { user } = jwt.verify(token, SECRET);
                return { models, user };
              } catch (err) {
                const newTokens = await refreshTokens(token, refreshToken, models, SECRET, SECRET2);
                return { models, user: newTokens.user };
              }
            }

            return { models };
          },
        },
        {
          server,
          path: '/subscriptions',
        },
      );
    });
  });
});

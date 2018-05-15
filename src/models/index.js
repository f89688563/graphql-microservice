import Sequelize from 'sequelize';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import decamelize from 'decamelize';
import cls from 'continuation-local-storage';

import { dbConfig } from '../config';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default async () => {
  let maxReconnects = 20;
  let connected = false;
  const ns = cls.createNamespace('db-namespace');
  Sequelize.useCLS(ns);
  const sequelize = new Sequelize(dbConfig.schema, dbConfig.user, dbConfig.password, {
    ...dbConfig.options,
    operatorsAliases: Sequelize.Op,
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
    // sync: {
    //   alter: true,
    // }
  });

  sequelize.beforeDefine((attributes, options) => {
    if (options) {
      // eslint-disable-next-line no-param-reassign
      options.tableName = decamelize(options.modelName);
    }
  });

  while (!connected && maxReconnects) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await sequelize.authenticate();
      connected = true;
    } catch (err) {
      console.log('reconnecting in 5 seconds');
      // eslint-disable-next-line no-await-in-loop
      await sleep(5000);
      maxReconnects -= 1;
    }
  }

  if (!connected) {
    return null;
  }

  const listModels = (dir) => {
    const models = {}
    // eslint-disable-next-line array-callback-return
    const handleFile = d => fs.readdirSync(path.resolve(__dirname, d)).map((file) => {
      const stats = fs.statSync(path.resolve(__dirname, dir, file))
      const relativePath = [dir, file].join('/')
      if (file === '__tests__') {
        // ignore test folder
      } else if (stats.isDirectory()) {
        _.forOwn(listModels(relativePath), (model, key) => Object.assign(models, { [key]: model }));
      } else if (stats.isFile()) {
        if (file !== 'index.js') {
          const modelName = (file.charAt(0).toUpperCase() + file.substr(1)).replace('.js', '')
          Object.assign(models, {
            [modelName]: sequelize.import(relativePath.replace('.js', '')),
          });
        }
      }
    });
    handleFile(dir);
    return models;
  }

  const models = listModels('.');

  _.forOwn(models, (model) => {
    if ('associate' in model) {
      model.associate(models);
    }
  });

  models.sequelize = sequelize;
  models.Sequelize = Sequelize;
  models.op = Sequelize.Op;

  return models;
};

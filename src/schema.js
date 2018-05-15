import { makeExecutableSchema } from 'graphql-tools';
import path from 'path';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import { addMiddleware } from 'graphql-add-middleware';

export default (sequelize) => {
  const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './schema'), { recursive: true }));
  const resolvers = mergeResolvers(fileLoader(path.join(__dirname, './resolvers'), { recursive: true }));
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const addTransaction = async (root, args, context, info, next) =>
    sequelize.transaction(() => next())
  addMiddleware(schema, 'Mutation', addTransaction);

  return schema;
};

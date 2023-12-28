import type { Resolvers } from '../../../generated/graphql';
import { createCsvMapper, csvMapperTest, deleteCsvMapper, fieldPatchCsvMapper, findAll, findById } from './csvMapper-domain';
import { errors, representationsDefaultValues } from './csvMapper-utils';

const csvMapperResolvers: Resolvers = {
  Query: {
    csvMapper: (_, { id }, context) => findById(context, context.user, id),
    csvMappers: (_, args, context) => findAll(context, context.user, args),
    csvMapperTest: (_, { configuration, content }, context) => csvMapperTest(context, context.user, configuration, content),
  },
  CsvMapper: {
    representations: (csvMapper, _, context) => representationsDefaultValues(context, context.user, csvMapper),
    errors: (csvMapper, _, context) => errors(context, context.user, csvMapper)
  },
  Mutation: {
    csvMapperAdd: (_, { input }, context) => {
      return createCsvMapper(context, context.user, input);
    },
    csvMapperDelete: (_, { id }, context) => {
      return deleteCsvMapper(context, context.user, id);
    },
    csvMapperFieldPatch: (_, { id, input }, context) => {
      return fieldPatchCsvMapper(context, context.user, id, input);
    },
  }
};

export default csvMapperResolvers;

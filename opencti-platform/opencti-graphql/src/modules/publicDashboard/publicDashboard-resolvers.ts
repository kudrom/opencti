import type { Resolvers } from '../../generated/graphql';
import { addPublicDashboard, findById } from './publicDashboard-domain';

const publicDashboardResolvers: Resolvers = {
  Query: {
    publicDashboard: (_, { id }, context) => findById(context, context.user, id),
  },
  Mutation: {
    publicDashboardAdd: (_, { dashboard_id }, context) => {
      return addPublicDashboard(context, context.user, dashboard_id);
    },
  },
};

export default publicDashboardResolvers;

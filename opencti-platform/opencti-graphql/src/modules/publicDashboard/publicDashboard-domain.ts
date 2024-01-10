import type { AuthContext, AuthUser } from '../../types/user';
import { storeLoadById } from '../../database/middleware-loader';
import { ENTITY_TYPE_PUBLIC_DASHBOARD, type BasicStoreEntityPublicDashboard } from './publicDashboard-types';
import { createEntity } from '../../database/middleware';
import { type BasicStoreEntityWorkspace, ENTITY_TYPE_WORKSPACE } from '../workspace/workspace-types';
import { fromBase64, toBase64 } from '../../database/utils';
import { notify } from '../../database/redis';
import { BUS_TOPICS } from '../../config/conf';

export const findById = (
  context: AuthContext,
  user: AuthUser,
  id: string,
) => {
  return storeLoadById<BasicStoreEntityPublicDashboard>(
    context,
    user,
    id,
    ENTITY_TYPE_PUBLIC_DASHBOARD,
  );
};

export const addPublicDashboard = async (
  context: AuthContext,
  user: AuthUser,
  dashboard_id: string,
) => {
  // Get private dashboard manifest
  const dashboard: BasicStoreEntityWorkspace = await storeLoadById(
    context,
    user,
    dashboard_id,
    ENTITY_TYPE_WORKSPACE,
  );
  const parsedManifest = JSON.parse(fromBase64(dashboard.manifest) ?? '{}');

  // Removing the "dataSelection" key
  Object.keys(parsedManifest.widgets).forEach((widgetId) => {
    delete parsedManifest.widgets[widgetId].dataSelection;
  });

  // Create public manifest
  const publicManifest = toBase64(JSON.stringify(parsedManifest));
  const publicDashboardToCreate = { public_manifest: publicManifest };

  // Create publicDashboard
  const created = await createEntity(
    context,
    user,
    publicDashboardToCreate,
    ENTITY_TYPE_PUBLIC_DASHBOARD,
  );
  return notify(BUS_TOPICS[ENTITY_TYPE_WORKSPACE].ADDED_TOPIC, created, user);
};

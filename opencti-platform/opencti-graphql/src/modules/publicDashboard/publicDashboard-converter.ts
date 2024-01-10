import { STIX_EXT_OCTI } from '../../types/stix-extensions';
import { buildStixDomain, cleanObject, convertObjectReferences } from '../../database/stix-converter';
import type { StixPublicDashboard, StoreEntityPublicDashboard } from './publicDashboard-types';

const convertPublicDashboardToStix = (instance: StoreEntityPublicDashboard): StixPublicDashboard => {
  const stixDomainObject = buildStixDomain(instance);
  return {
    ...stixDomainObject,
    name: instance.name,
    description: instance.description,
    dashboard_id: instance.dashboard_id,
    user_id: instance.user_id,
    public_manifest: instance.public_manifest,
    uri_keys: instance.uri_keys,
    aliases: instance.x_opencti_aliases ?? [],
    extensions: {
      [STIX_EXT_OCTI]: cleanObject({
        ...stixDomainObject.extensions[STIX_EXT_OCTI],
        extension_type: 'new-sdo',
        object_refs_inferred: convertObjectReferences(instance, true),
      })
    }
  };
};

export default convertPublicDashboardToStix;

import { type ManagerDefinition, registerManager } from './managerModule';
import conf, { booleanConf, logApp } from '../config/conf';
import { executionContext, SYSTEM_USER } from '../utils/access';
import { findIndicatorsForDecay, updateIndicatorDecayScore } from '../modules/indicator/indicator-domain';

const INDICATOR_DECAY_MANAGER_ENABLED = booleanConf('indicator_decay_manager:enabled', true);
const INDICATOR_DECAY_MANAGER_KEY = conf.get('indicator_decay_manager:lock_key');
const SCHEDULE_TIME = conf.get('indicator_decay_manager:interval') || 60000; // 1 minute
const BATCH_SIZE = conf.get('indicator_decay_manager:batch_size') || 10000;

// testable
const indicatorDecayHandler = async () => {
  // TODO migrate expiredManager
  const context = executionContext('indicator_decay_manager');
  const indicatorsToUpdate = await findIndicatorsForDecay(context, SYSTEM_USER, BATCH_SIZE);
  for (let i = 0; i < indicatorsToUpdate.length; i += 1) {
    const indicator = indicatorsToUpdate[i];
    await updateIndicatorDecayScore(context, SYSTEM_USER, indicator);
  }
  logApp.debug(`[OPENCTI-MODULE] Indicator decay manager updated ${indicatorsToUpdate.length} indicators`);
};

const INDICATOR_DECAY_MANAGER_DEFINITION: ManagerDefinition = {
  id: 'INDICATOR_DECAY_MANAGER',
  label: 'Indicator decay manager',
  executionContext: 'indicator_decay_manager',
  cronSchedulerHandler: {
    handler: indicatorDecayHandler,
    interval: SCHEDULE_TIME,
    lockKey: INDICATOR_DECAY_MANAGER_KEY,
  },
  enabledByConfig: INDICATOR_DECAY_MANAGER_ENABLED,
  enabledToStart(): boolean {
    return this.enabledByConfig;
  },
  enabled(): boolean {
    return this.enabledByConfig;
  }
};

registerManager(INDICATOR_DECAY_MANAGER_DEFINITION);

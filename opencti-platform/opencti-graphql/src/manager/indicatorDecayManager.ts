import { type ManagerDefinition, registerManager } from './managerModule';
import conf, { booleanConf, logApp } from '../config/conf';

const INDICATOR_DECAY_MANAGER_ENABLED = booleanConf('indicator_decay_manager:enabled', true);
const INDICATOR_DECAY_MANAGER_KEY = conf.get('indicator_decay_manager:lock_key');
const SCHEDULE_TIME = conf.get('indicator_decay_manager:interval') || 6000; // 1 minute

// testable
const indicatorDecayHandler = async () => {
  // TODO
  logApp.debug('indicatorDecayHandler running');
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

import _ from 'lodash';
import { Loader } from '@daojs/calculation-network';
import Registry from '@daojs/registry';
import { master } from '@daojs/worker-agent';
import builtinProcedures from '@daojs/procedures/builtin';

export const ProcedureRegistry = new Registry();

ProcedureRegistry.register(builtinProcedures);

const loader = new Loader(ProcedureRegistry);
const p$cn = master.call('getStory').then(story => loader.load(story));

master.register({
  async set(value) {
    const invalidateKeys = (await p$cn).set(value);
    _.forEach(invalidateKeys, k => master.trigger(`cn-invalidate:${k}`));
  },
  async get(key) {
    return (await p$cn).get(key);
  },
});

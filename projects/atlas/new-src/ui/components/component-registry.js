/* eslint-disable lodash/prefer-lodash-method */
import _ from 'lodash';
import { List } from 'immutable';
import PlainData from './plain-data';
import SectionContainer from './section-container';

class Comp {
  constructor(definition) {
    [this.name] = _.keys(definition);
    [this.value] = _.values(definition);
  }
}

export class SyncComp extends Comp {}

export class AsyncComp extends Comp {}

class ComponentRegistry {
  registry = List([
    new AsyncComp({ SingleSelector: () => import('./single-selector').then(_.property('default')) }),
    new SyncComp({ PlainData }),
    new SyncComp({ SectionContainer }),
  ])

  get = (name) => {
    const component = this.registry.find(comp => comp.name === name);
    return component instanceof SyncComp ?
      component.value :
      component.value();
  }
}

export default new ComponentRegistry();
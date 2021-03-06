import React from 'react';
import ReactDOM from 'react-dom';
import {
  AppFrame,
  ComponentRegistry,
} from '@daojs/ui';
import * as botanaComponents from '@daojs/botana-components';
import * as components from './components';
import {
  Fundamentals,
  AIOperations,
  CustomStories,
} from './stories/index';

ComponentRegistry.register(botanaComponents).register(components);
ReactDOM.render(
  <AppFrame
    title="索迪斯大数据平台"
    logo="img/sodexo.png"
    categories={[{
      id: '35a62e19-4b1b-4541-85aa-aa86b56c44ae',
      name: '基础面板',
      stories: Fundamentals,
    }, {
      id: 'b115caf6-620f-4a07-9cff-7f813d7e2c5f',
      name: '智能运营助手',
      stories: AIOperations,
    }, {
      id: '0dabd0a2-1124-54a3-98dc-685aa110d129',
      name: '定制story',
      stories: CustomStories,
      isStoryEditable: true,
    }]}
    defaultStory="c4718aca-2705-5941-be66-afe4b08f3a08"
    componentRegistry={ComponentRegistry}
  />,
  document.getElementById('container'),
);

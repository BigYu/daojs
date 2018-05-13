import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { ComponentRegistry } from '@daojs/ui';
import { Button } from 'antd';
import { frameMapper } from '../frameMapper';

class TemplateView extends React.PureComponent {
  render() {
    const {
      name,
      title,
      logo,
      categories,
      id,
      frameType = 'AppFrame',
    } = this.props;

    const Frame = frameMapper[frameType];

    const content = (<Frame
      title={title}
      logo={logo}
      categories={categories}
      defaultStory={_.head(categories).id}
      componentRegistry={ComponentRegistry}
    />);

    return (
      <div>
        <Button
          type="primary"
          href={`#/templates/${name}/stories`}
          style={{
            margin: '0.5rem 3rem',
          }}
        >
          View
        </Button>
        <Button
          type="secondary"
          href={`#/editor/${frameType}/${id}`}
          style={{
            margin: '0.5rem 3rem',
          }}
        >
          Try online
        </Button>
        {content}
      </div>
    )
  }
}


TemplateView.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  logo: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(PropTypes.any).isRequired,
  id: PropTypes.string.isRequired,
  frameType: PropTypes.string.isRequired,
};

export default TemplateView;
import Immutable from 'immutable';
import React from 'react';
import PropTypes from 'prop-types';
import CalculationNetwork from './calculation-network';

export default class StoryBoard extends React.Component {
  constructor(props) {
    super(props);
    const {
      story: {
        parameters,
        cells,
      },
      renderContent,
    } = props;

    this.state = {
      results: Immutable.Map(),
      updating: Immutable.Map(),
    };

    this.calculationNetwork = new CalculationNetwork({
      parameters,
      cells,
      willRecalculate: ({ key }) => {
        this.setState(({ updating }) => ({
          updating: updating.set(key, true),
        }));
      },
      didRecalculate: ({ key, value, isAbandoned }) => {
        if (!isAbandoned) {
          this.setState(({
            results,
            updating,
          }) => ({
            results: results.set(key, value),
            updating: updating.set(key, false),
          }));
        }
      },
    });
    this.renderContent = renderContent;
  }

  render() {
    const {
      state: {
        results,
        updating,
      },
      calculationNetwork,
    } = this;

    return this.renderContent({
      read(key) {
        return results.get(key);
      },
      write(key, value) {
        calculationNetwork.set(key, value);
      },
      isUpdating(key) {
        return updating.get(key);
      },
    });
  }
}

StoryBoard.propTypes = {
  story: PropTypes.shape({
    parameters: PropTypes.objectOf(PropTypes.shape({
      default: PropTypes.any,
    })),

    cells: PropTypes.objectOf(PropTypes.shape({
      dependencies: PropTypes.arrayOf(PropTypes.string),
      factory: PropTypes.func,
    })),
  }).isRequired,
  renderContent: PropTypes.func.isRequired,
};

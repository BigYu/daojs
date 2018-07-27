import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { DatePicker } from 'antd';
import moment from 'moment';

const { RangePicker } = DatePicker;

const dateFormat = 'YYYY-MM-DD';

export default class TimeRangePicker extends PureComponent {
  constructor(props) {
    super(props);

    if (!props.start || !props.end) {
      props.update({
        start: '2018-01-01',
        end: '2018-04-01',
      });
    }
  }

  onChange(values) {
    const [start, end] = values;
    const value = { start: start.format(dateFormat), end: end.format(dateFormat) };
    this.props.update(value);
  }

  render() {
    const { start = '2018-01-01', end = '2018-04-01' } = this.props;

    return (
      <div>
        {this.props.label}
        <RangePicker
          defaultValue={[moment(start, dateFormat), moment(end, dateFormat)]}
          format={dateFormat}
          onChange={args => this.onChange(args)}
        />
      </div>);
  }
}

TimeRangePicker.propTypes = {
  start: PropTypes.string,
  end: PropTypes.string,
  label: PropTypes.string,
  update: PropTypes.func.isRequired,
};

TimeRangePicker.defaultProps = {
  label: null,
  start: undefined,
  end: undefined,
};

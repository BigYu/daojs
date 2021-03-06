import PropTypes from 'prop-types';
import React from 'react';

export default function BestUser(props) {
  return (
    <span>{`最佳客户是来自${props.department}的${props.discipline}。`}</span>
  );
}

BestUser.propTypes = {
  department: PropTypes.string.isRequired,
  discipline: PropTypes.string.isRequired,
};

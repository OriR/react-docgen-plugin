import React, { Component } from 'react';
import PropTypes from 'prop-types';
import B from './B.jsx';

export default class A extends Component {
  render() {
    return (
      <div>
        
      </div>
    )
  }
}

A.defaultProps = {
  boolProp: true
};

A.propTypes = {
  ...B.propTypes,
  /**
   * Description for boolProp
   */
  boolProp: PropTypes.bool,
  /**
   * Description for objectOfProp
   */
  objectOfProp: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['String', 'Number']), PropTypes.func]))
};

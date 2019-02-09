import React, { Component } from 'react';
import PropTypes from 'prop-types';

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
  /**
   * Description for boolProp
   */
  boolProp: PropTypes.bool,
  /**
   * Description for objectOfProp
   */
  objectOfProp: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['String', 'Number']), PropTypes.func]))
};

export class B extends Component {
  render() {
    return (
      <div>
        
      </div>
    )
  }
}

B.defaultProps = {
  anyProp: {}
};

B.propTypes = {
  /**
   * Description for numberProp
   */
  numberProp: PropTypes.number,
  /**
   * Description for anyProp
   */
  anyProp: PropTypes.any
};
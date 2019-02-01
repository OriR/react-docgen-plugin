import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class C extends Component {
  render() {
    return (
      <div>
        
      </div>
    )
  }
}

C.defaultProps = {
  boolProp: true
};

C.propTypes = {
  /**
   * Description for boolProp
   */
  boolProp: PropTypes.bool,
  /**
   * Description for objectOfProp
   */
  objectOfProp: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['String', 'Number']), PropTypes.func]))
};

export class D extends Component {
  render() {
    return (
      <div>
        
      </div>
    )
  }
}

D.defaultProps = {
  anyProp: {}
};

D.propTypes = {
  ...C.propTypes,
  /**
   * Description for numberProp
   */
  numberProp: PropTypes.number,
  /**
   * Description for anyProp
   */
  anyProp: PropTypes.any
};
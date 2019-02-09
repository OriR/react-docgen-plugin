import React, { Component } from 'react'
import PropTypes from 'prop-types';
import A, { B } from './A-B.jsx';

export default class E extends Component {
  render() {
    return (
      <div>
        
      </div>
    )
  }
}

E.defaultProps = {
  anyProp: {}
};

E.propTypes = {
  ...A.propTypes,
  ...B.propTypes,
  /**
   * Description for numberProp
   */
  numberProp: PropTypes.number,
  /**
   * Description for anyProp
   */
  anyProp: PropTypes.any
};
import React, { Component } from 'react'
import PropTypes from 'prop-types';
import A from './A.jsx';

export default class C extends Component {
  render() {
    return (
      <div>
        
      </div>
    )
  }
}

C.propTypes = {
  ...A.propTypes,
  anyProp: PropTypes.any,
  /**
   * Only one description
   */
  nodeProp: PropTypes.node
}

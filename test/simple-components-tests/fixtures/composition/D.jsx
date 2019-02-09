import React, { Component } from 'react';
import PropTypes from 'prop-types';
import B from 'B.jsx';
import E from 'E.jsx';

export default class D extends Component {
  render() {
    return (
      <div>
        
      </div>
    )
  }
}

D.propTypes = {
  ...B.propTypes,
  ...E.propTypes,
  /**
   * Some prop
   */
  someProp: PropTypes.oneOfType([PropTypes.shape({
    /**
     * Some shape index
     */
    index: PropTypes.number.isRequired,
    /**
     * Some shapre array
     */
    array: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.number))
  }), PropTypes.func])
}
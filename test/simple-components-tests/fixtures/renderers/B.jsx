import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class B extends Component {
  render() {
    return (
      <div>
        
      </div>
    )
  }
}

B.propTypes = {
  /**
   * Description for stringProp
   */
  stringProp: PropTypes.string,
  /**
   * Description for arrayOfProp
   */
  arrayOfProp: PropTypes.arrayOf(PropTypes.shape({
    /**
     * Description for required index in shape
     */
    index: PropTypes.number.isRequired,
  })),
}

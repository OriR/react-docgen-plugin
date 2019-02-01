import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class A extends Component {
  render() {
    return (
      <div>
        
      </div>
    )
  }
}

A.propTypes = {
  /**
   * Some number prop
   */
  index: PropTypes.number,
  /**
   * Some required function prop
   */
  func: PropTypes.func.isRequired,
};

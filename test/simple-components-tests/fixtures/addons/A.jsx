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

A.customShape = {
  /**
   * Custom shape with id
   */
  id: PropTypes.number,
  /**
   * Custom shape with title
   */
  title: PropTypes.string
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
  /**
   * My shape
   */
  shape: PropTypes.shape(A.customShape)
};

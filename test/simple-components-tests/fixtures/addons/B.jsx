import React, { Component } from 'react'
import PropTypes from 'prop-types'
import A from './A.jsx';
import { customShape } from './customTypes.jsx';

export default class B extends Component {
  render() {
    return (
      <div>
        
      </div>
    )
  }
}

const customType = () => true;

B.defaultProps = {
  boolean: true,
  func: () => console.log(1),
  union: 'ABC'
};

B.propTypes = {
  /**
   * Complex type composed from non-component.
   */
  maybeArrayOf: PropTypes.oneOfType([customShape, PropTypes.arrayOf(customShape)]),
  /**
   * Shapy shape
   */
  customTypeShape: customShape,
  /**
   * Array of A.
   */
  arrayOfA: PropTypes.arrayOf(PropTypes.shape(A.propTypes)),
  /**
   * Specific A prop shape
   */
  specificA: PropTypes.shape({ ...A.propTypes }),
  /**
   * inner prop from A
   */
  innerAProp: A.propTypes.func,
  /**
   * Array of A custom shape.
   */
  aCustomShape: PropTypes.arrayOf(PropTypes.shape(A.customShape)),
  /**
   * Union type
   */
  union: PropTypes.oneOf(['ABC', '123', 'Doe-Re-Mi']).isRequired,
  typeOf: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]),
  /**
   * Boolean
   */
  boolean: PropTypes.bool,
  func: PropTypes.func,
  /**
   * Something else
   */
  whatever: PropTypes.any,
  object: PropTypes.object,
  /**
   * Weird object
   */
  objectOf: PropTypes.objectOf(PropTypes.string).isRequired,
  nodeType: PropTypes.node,
  element: PropTypes.element,
  /**
   * Custom Date
   */
  instanceDate: PropTypes.instanceOf(Date),
  highly: PropTypes.arrayOf(PropTypes.shape({
    generic: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func,
      PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape({
        /**
         * Some very nested index
         */
        index: PropTypes.number,
        /**
         * Some other function, nested
         */
        render: PropTypes.func,
      }).isRequired)),
    ]),
  })),
  custom: customType,
  customArrayOf: PropTypes.arrayOf(customType),
  customObjectOf: PropTypes.objectOf(customType),
  customArrayOf1: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  customObjectOf1: PropTypes.objectOf(PropTypes.instanceOf(Date))
};
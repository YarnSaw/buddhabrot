
/**
 * @typedef config
 * @type {object}
 * @property {number} imageScaleup - scale from dimensions to image dimensions
 * @property {number} escapeReal - value where a real number larger than this is considered to have escaped
 * @property {number} escapeComplex-  value where a complex number larger than this is considered to have escaped
 * @property {number} iterations - iterations to be computed
 * @property {number} calculationAccuracy - accuracy to calculate the image at - how many segments to cut an integer value into to compute
 * @property {object} setDimensions - how far in each direction to compute in real and complex axes.
 */

/**
 * Returns the configuration that will always be used for the image
 * @returns {config} Configuration
 */
exports.init = function init() {
  return {
    imageScaleup: 150,
    setDimensions: {
      up: 2,
      down: -2,
      right: 1,
      left: -2.5,
    },
    escapeReal: 3,
    escapeComplex: 3,
    iterations: 2,
    // (setDimensions[direction] * calculationAccuracy) is the number of starting points
    // that will be calculated, spaced evenly across the set.
    calculationAccuracy: 200,
  };
};

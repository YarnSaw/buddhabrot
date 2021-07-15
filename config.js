/**
 *  @file       config.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       July 2021
 *
 * Creates a config object for the set
 */

'use strict';

/**
 * @typedef config
 * @type {object}
 * @property {number} imageScaleup - scale from dimensions to image dimensions
 * @property {number} escapeDistance - distance for a point to be considered to have escaped
 * @property {number} iterations - iterations to be computed
 * @property {number} calculationAccuracy - accuracy to calculate the image at - how many segments to cut an integer value into to compute
 * @property {object} setDimensions - how far in each direction to compute in real and complex axes.
 * @property {Boolean} [dcp] - if the generation is done using DCP
 */

/**
 * Returns the configuration that will always be used for the image
 * Note: highly recommended that imageScaleup be either equal to, or
 * a direct multiple of calculationAccuracy.
 * ie if imageScaleup = 100, than calculation accuracy should be 50, 100, 200 etc.
 * @returns {config} Configuration
 */
exports.init = function init() {
  return {
    setDimensions: {
      up: 1.1,
      down: -1.1,
      right: 0.75,
      left: -1.5,
    },
    escapeDistance: 3,
    iterations: 100,
    // calculationAccuracy is how much the image is subdivided in calculations. Larger = more subdivisions
    calculationAccuracy: 600,
    imageScaleup: 300,
  };
};

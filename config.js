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
 * @property {function(number, number):number[]} colorFunc - function to color each pixel based off visits to it.
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
    imageScaleup: 300,
    setDimensions: {
      up: 1.25,
      down: -1.25,
      right: 1,
      left: -2,
    },
    escapeDistance: 3,
    iterations: 100,
    // (setDimensions[direction] * calculationAccuracy) is the number of starting points
    // that will be calculated, spaced evenly across the set.
    calculationAccuracy: 600,
    colorFunc: function colorFunc(visits, mostVisits) {
      return [
        visits / mostVisits * 255,
        visits / mostVisits * 255,
        0];
    },
  };
};

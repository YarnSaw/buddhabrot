/**
 *  @file       config.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       July 2021
 *
 * Creates a config object for the set
 */

'use strict';

module.declare([], function(require, exports, modules) {

/**
 * @typedef config
 * @type {object}
 * @property {number} imageScaleup - scale from dimensions to image dimensions
 * @property {number} escapeDistance - distance for a point to be considered to have escaped
 * @property {number} iterations - iterations to be computed
 * @property {number} calculationAccuracy - accuracy to calculate the image at - how many segments to cut an integer value into to compute
 * @property {object} setDimensions - dimensions for the full set to be computed.
 * @property {Boolean} colorImage -  if true, color the image while creating it, else return raw point values for pixels in the image 
 * @property {number} segmentNumber - segment of partial set to generate
 * @property {number} totalSegments - total segments the set will be using. Must be a square number to break the segment into a grid.
 * @property {object} [calcDimensions] - dimensions to calculate for one specific slice/segment of the image. Make equal to setDimensions to generate full image, or part of it for good slicing.
 * @property {Boolean} [dcp] - if the generation is done using DCP
 * @property {Boolean} [asyncGen] - have async operations within the buddhabrot generation, for local generation.
 * @property {string|function} colorFunction - function to use to color the image
 *    @param {number} visits - how often this pixel to be colored has been visited
 *    @param {number} mostVisits - number of times the most visited pixel was visited
 *    @returns {array} array with 3 elements: the RGB values of the pixels.
 * 
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
      up: 1.25,
      down: -1.25,
      right: 1,
      left: -1.75,
    },
    segmentNumber: 1,
    totalSegments: 1,
    escapeDistance: 3,
    iterations: 100,
    // calculationAccuracy is how much the image is subdivided in calculations. Larger = more subdivisions
    calculationAccuracy: 300,
    imageScaleup: 300,
    colorImage: true,
    colorFunction: (visits, mostVisits) => {
      return [
        visits / mostVisits * 255,
        visits / mostVisits * 255,
        0
      ];
    },
    asyncGen: true,
    
  };
};

});
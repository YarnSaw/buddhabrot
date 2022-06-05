
/**
 *  @file       set-generation.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       July 2021
 *
 * Utility functions create the set of all points in the buddhabrot
 */

/**
 * @typedef {import('./config.js').config} config
 */

'use strict';

module.declare([], function(require, exports, modules) {

/**
 * Calculates if a given point is in the mandelbrot, and if it isn't
 * will return the escape path.
 * @param {Array} startPoint
 * @param {config} config
 * @returns {Array.<number[]>} path points take to escape the set.
 */
function calculatePath(startPoint, config) {
  const { iterations, escapeDistance, } = config;
  let realValueNew;
  let realValue = startPoint[0];
  let complexValue = startPoint[1];
  /** @type {Array.<number[]>} */
  const escapePath = [[realValue, complexValue]];
  const escapeDistanceSquared = escapeDistance ** 2;

  for (let i = 0; i < iterations; i++) {
    // Mandelbrot function:
    // c = starting value in the complex plane
    // z = c
    // z = z ** 2 + c
    // Repeat that step ad infinitum
    // If the point doesn't go towards infinity, it is in the mandelbrot set.
    // The buddhabrot set is the escape paths of all points that do go towards infinity.
    realValueNew = realValue ** 2 - complexValue ** 2;
    complexValue = 2 * realValue * complexValue + startPoint[1];
    realValue = realValueNew + startPoint[0];
    const distanceFromOrigin = realValue ** 2 + complexValue ** 2;
    if (distanceFromOrigin > escapeDistanceSquared) {
      // The value has 'escaped' to infinity and thus it's path is in the buddhabrot
      return escapePath;
    }
    escapePath.push([realValue, complexValue]);
  }

  // eslint-disable-next-line no-useless-return
  return;
}

/**
 * Calculates the escape paths of all points as defined in the buddhabrot config.
 * @param {config} config
 * @returns {Promise<Array.<number[]>>} - list of all escape paths of all points calculated.
 */
exports.generateAllPoints = async function findAllPaths(config) {
  const { setDimensions, calculationAccuracy, } = config;
  const accuracy = 1 / calculationAccuracy;
  const escapePaths = [];
  const numHeightIter = (setDimensions.up - setDimensions.down)/accuracy;
  let iter = -1;
  for (let height = setDimensions.up; height > setDimensions.down; height = height - accuracy) {
    iter++;
    if (config.dcp) {
      // @ts-ignore
      progress(); // eslint-disable-line no-undef
    }
    for (let width = setDimensions.left; width < setDimensions.right; width = width + accuracy) {
      const path = calculatePath([width, height], config);
      if (path) {
        escapePaths.push(path);
      }
    }
  }
  return escapePaths.flat();
};

/**
 * Take a set of points pairs + a config, and will map those points to a new array
 * that counts how often each pixel in the image has been hit
 * @param {Array.<number[]>} allPoints - pairs of points
 * @param {config} config - buddhabrot config
 * @returns {Array.<number[]>} imagePointOccurances - frequency each pixel in the image is hit
 */
exports.cleanupSet = function cleanPoints(allPoints, config) {
  const { imageScaleup, setDimensions, } = config;
  const width = Math.floor(imageScaleup * (setDimensions.right - setDimensions.left) + 1);
  const height = Math.floor(imageScaleup * (setDimensions.up - setDimensions.down) + 1);
  const imagePointOccurances = new Array(height).fill().map(() => Array(width).fill(0));

  for (const point of allPoints) {
    // It's possible for a point to fall in the range between the screens view and the escape
    // Distance, so filter those out
    if ( true
      && point[0] > setDimensions.left
      && point[0] < setDimensions.right
      && point[1] > setDimensions.down
      && point[1] < setDimensions.up) {
      const realScaledValue = Math.round(point[0] * imageScaleup + -setDimensions.left * imageScaleup);
      const complexScaledValue = Math.round(point[1] * imageScaleup + -setDimensions.down * imageScaleup);
      imagePointOccurances[complexScaledValue][realScaledValue]++;
    }
  }
  return imagePointOccurances;
};

/**
 * Take the set of all points and convert them into the image to be rendered
 * @param {number[]} cleanedSet - clean and processed set of integers to be processed for their coloring
 * @param {number} width - width of the image
 * @param {number} height - height of the image
 * @param {number} mostVisits - value at most visited pixel
 * @param {function(number, number):number[]} colorFunc - function to color each pixel based off visits to it.
 * @returns Uint8ClampedArray that is the full image
 */
exports.processCountsToColor = function processCountsToColor(cleanedSet, width, height, mostVisits, colorFunc) {
  const uint8Array = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const coloring = colorFunc(cleanedSet[i], mostVisits);
    uint8Array[i * 4 + 0] = coloring[0];
    uint8Array[i * 4 + 1] = coloring[1];
    uint8Array[i * 4 + 2] = coloring[2];
    uint8Array[i * 4 + 3] = 255;
  }
  return uint8Array;
};

})
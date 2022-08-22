
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
 * @param {number} iterations - number of iterations to calculate over
 * @param {number} escapeDistance - distance for a point to be considered 'escaped'
 * @returns {Array.<number[]>} path points take to escape the set.
 */
function calculatePath(startPoint, iterations, escapeDistance) {
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
      // The value has 'escaped' to infinity and thus it's path is in the buddhabrot. To reduce noise, only count sufficiently long paths.
      if (i > iterations/10)
        return escapePath;
      else
        return;
    }
    escapePath.push([realValue, complexValue]);
  }

  return;
}

/**
 * Calculates the escape paths of all points as defined in the buddhabrot config.
 * @param {object} calcDimensions - dimensions to calculate for in this iteration
 * @param {number} calculationAccuracy - accuracy to calculate within the dimensions for (separate each 1x1 block into calculationAccuracy x calculationAccuracy area to compute)
 * @param {number} iterations - number of iterations to calculate over
 * @param {number} escapeDistance - distance for a point to be considered 'escaped'
 */
exports.generateAllPoints = async function findAllPaths(calcDimensions, calculationAccuracy, iterations, escapeDistance, partialImage, config) {
  const accuracy = 1 / calculationAccuracy;
  let progressPercent = 0;
  let progressMax = ((calcDimensions.right - calcDimensions.left) / accuracy) * ((calcDimensions.up - calcDimensions.down) / accuracy) + 10 // + 10 to make sure rounding errors don't cause problems
  for (let height = calcDimensions.up; height > calcDimensions.down-accuracy /* stop 1 early so no duplicates when image is split up */; height = height - accuracy) {
    for (let width = calcDimensions.left; width < calcDimensions.right-accuracy /* stop 1 early so no duplicates when image is split up */; width = width + accuracy) {
      if (config.dcp) {
        // @ts-ignore
        progress(Math.min(0.9999, progressPercent/progressMax)); // eslint-disable-line no-undef
      }
      progressPercent++;

      // check if point is in the cardioid or period-2 bulb
      const p = Math.sqrt((width-1/4)**2 + height**2);
      const inCardioid = width <= p - 2 * (p**2) + 1/4
      const inBulb = (width+1)**2 + height**2 <= 1/16
    
      if (inBulb || inCardioid)
        continue;

      const path = calculatePath([width, height], iterations, escapeDistance);
      exports.joinPointsToSet(path, partialImage, config);
    }
  }
};

/**
 * Takes in a set of points, as well as a 2d array and maps the new points into their appropriate
 * location within the grid.
 * @param {Array.<number[]>} allPoints - pairs of points
 * @param {Array.<number[]>} currentSet - set to be built upon
 * @param {config} config - buddhabrot config
 */
exports.joinPointsToSet = function cleanPoints(allPoints, currentSet, config) {
  const { imageScaleup, setDimensions, } = config;

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
      currentSet[complexScaledValue][realScaledValue]++;
    }
  }
};

/**
 * Takes in multiple 1d arrays that are all expected be the same length
 * returns a new array with all the values in each cell added together
 * @param {Array<number[]>} arrays - list of arrays to concat
 * @returns {Array.<number[]>} result of the concatenations 
*/
exports.concatenateSets = function cleanPoints(...arrays)
{
  const len = arrays[0].length;
  const concatenatedArray = new Array(len).fill(0);

  for (let array of arrays)
    for (let i = 0; i < len; i++)
        concatenatedArray[i] += array[i];
  
  return concatenatedArray;
};

/**
 * Take the set of all points and convert them into the image to be rendered
 * @param {number[]} cleanedSet - clean and processed set of integers to be processed for their coloring
 * @param {number} width - width of the image
 * @param {number} height - height of the image
 * @param {number} mostVisits - value at most visited pixel
 * @param {function(number, number):number[]} colorFunc - function to color each pixel based off visits to it.
 * @returns {Uint8ClampedArray} - the full image
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
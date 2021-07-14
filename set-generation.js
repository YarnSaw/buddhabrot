
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
 * @returns {Array.<number[]>} - list of all escape paths of all points calculated.
 */
exports.generateAllPoints = function findAllPaths(config) {
  const { setDimensions, calculationAccuracy, } = config;
  const accuracy = 1 / calculationAccuracy;
  const escapePaths = [];
  for (let height = setDimensions.up; height > setDimensions.down; height = height - accuracy) {
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
  const width = imageScaleup * (setDimensions.right - setDimensions.left) + 1;
  const height = imageScaleup * (setDimensions.up - setDimensions.down) + 1;
  const imagePointOccurances = new Array(height).fill().map(() => Array(width).fill(0));

  for (const point of allPoints) {
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

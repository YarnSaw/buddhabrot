
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
    for (let width = setDimensions.left; width < setDimensions.right; width = width + accuracy) {
      const path = calculatePath([width, height], config);
      if (path) {
        escapePaths.push(path);
      }
    }
  }
  return escapePaths.flat();
};

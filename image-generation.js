/**
 *  @file       image-generation.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       July 2021
 *
 * Utility functions to do everything required to generate an image from a set of points.
 */

/**
 * @typedef {import('./config.js').config} config
 */

'use strict';

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

exports.drawCanvas = function drawCanvas(context, cleanedSet, width, height, mostVisits, colorFunc) {
  const imgData = context.createImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    if (i % 100000 === 0) {
      console.log(`reached ${i} of ${width * height} total`);
    }
    const coloring = colorFunc(cleanedSet[i], mostVisits);
    imgData.data[i * 4 + 0] = coloring[0];
    imgData.data[i * 4 + 1] = coloring[1];
    imgData.data[i * 4 + 1] = coloring[2];
    imgData.data[i * 4 + 3] = 255;
  }
  context.putImageData(imgData, 0, 0);
};

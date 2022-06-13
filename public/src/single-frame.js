/**
 *  @file       single-frame.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       July 2021
 *
 * Create and save a single frame of the buddhabrot, generated using a buddhabrot config
 */

/**
 * @typedef {import('./config.js').config} config
 */

'use strict';

// @ts-ignore
module.declare(['./set-generation'], function(require, exports, modules) {


const { generateAllPoints, processCountsToColor, } = require('./set-generation');

/**
 * Creates all the necessary data for a single frame of the buddhabrot
 * @param {config} config - buddhabrot config
 * @returns features needed to create the buddhabrot image
 */
exports.createFrame = async function createFrame(config) {
  // Find all the points for the set.
  const { imageScaleup, setDimensions, } = config;
  const width = Math.floor(imageScaleup * (setDimensions.right - setDimensions.left) + 1);
  const height = Math.floor(imageScaleup * (setDimensions.up - setDimensions.down) + 1);
  const pointsInImage = new Array(height).fill().map(() => Array(width).fill(0));

  if (config.totalSegments === 1)
    config.calcDimensions = config.setDimensions;
  else
  {
    const sizeOfImage = Math.sqrt(config.totalSegments);
    const offsetW = config.segmentNumber % sizeOfImage;
    const offsetH = Math.floor(config.segmentNumber / sizeOfImage);
    const totalHeight = config.setDimensions.up - config.setDimensions.down;
    const totalWidth = config.setDimensions.right - config.setDimensions.left;

    config.calcDimensions = {
      up: config.setDimensions.up - (totalHeight * offsetH / sizeOfImage),
      down: config.setDimensions.up - (totalHeight * (offsetH + 1) / sizeOfImage),
      right: config.setDimensions.right - (totalWidth * offsetW / sizeOfImage),
      left: config.setDimensions.right - (totalWidth * (offsetW + 1) / sizeOfImage),
    };
  }

  await generateAllPoints(config.calcDimensions, config.calculationAccuracy, config.iterations, config.escapeDistance, pointsInImage, config);
  if (config.dcp) {
    // @ts-ignore
    progress(); // eslint-disable-line no-undef
  }

  let flatCleanedSet = pointsInImage.flat();

  if (config.smoothingKernel)
  {
    const smoothedFlatCleanSet = new Array(flatCleanedSet.length).fill(0);
    const map = [-1, 1, width, -width, width + 1, width - 1, -width + 1, -width - 1 ];
    for (let index = 0; index < flatCleanedSet.length; index++)
    {
      let newVisits = 0
      if ( index%width  == 0
        || index%width  == width - 1
        || index - width < 0
        || index + width > flatCleanedSet.length)
        continue;
      for (let [i, elem] of map.entries())
      {
        newVisits += flatCleanedSet[index + elem] * config.smoothingKernel[Math.floor(i/3)][i%3];
      }
      smoothedFlatCleanSet[index] = newVisits;
    }
    flatCleanedSet = smoothedFlatCleanSet;
  }

  const countOfMostVisits = flatCleanedSet.reduce(function(a, b) {
    return Math.max(a, b);
  });

  return {
    set: flatCleanedSet,
    width,
    height,
    countOfMostVisits,
    iterations: config.iterations,
  }
};

exports.displayFrame = function displayFrame(frameData) {
  const { width, height, set, } = frameData;
  // use npm canvas to create a display for the results
  const canvas = document.createElement('canvas');
  canvas.id = "canvasImg";
  // @ts-ignore
  canvas.width = width;
  // @ts-ignore
  canvas.height = height;
  // @ts-ignore
  const context = canvas.getContext('2d');
  const imgData = context.createImageData(width, height);

  for (let i = 0; i < set.length; i++) {
    imgData.data[i] = set[i];
  }
  context.putImageData(imgData, 0, 0);

  document.getElementById('canvasDiv').appendChild(canvas);
};

});
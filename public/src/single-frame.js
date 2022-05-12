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


const { generateAllPoints, processCountsToColor, cleanupSet, } = require('./set-generation');

/**
 * Creates all the necessary data for a single frame of the buddhabrot
 * @param {config} config - buddhabrot config
 * @returns features needed to create the buddhabrot image
 */
exports.createFrame = function createFrame(config) {
  // Find all the points for the set.
  const setPoints = generateAllPoints(config);
  if (config.dcp) {
    // @ts-ignore
    progress(); // eslint-disable-line no-undef
  }
  // Process the points / prepare them for the image
  const cleanedSet = cleanupSet(setPoints, config);
  const width = cleanedSet[0].length;
  const height = cleanedSet.length;
  let flatCleanedSet = cleanedSet.flat();

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

  if (config.colorImage)
  {
    console.log("hey")
    // Ensure the color func is a function. May need to be a string to get past serialization in a worker.
    if (typeof config.colorFunction === 'string')
      config.colorFunction = eval(config.colorFunction)
    // @ts-ignore
    const uint8Array = processCountsToColor(flatCleanedSet, width, height, countOfMostVisits, config.colorFunction);

    return {
      set: uint8Array,
      width,
      height,
    };
  }
  return {
    set: flatCleanedSet,
    width,
    height,
  }
};

/**
 * Save the generated image
 * @param {object} frameData - width, height, and color values for the image
 * @param {string} imagePath - path to save the image
 * @param {*} [encoder] - encoder for gif
 * @param {object} [settings] - environment settings
 */
exports.saveFrame = function saveFrame(frameData, imagePath, encoder, settings) {
  const { width, height, set, } = frameData;
  const { createCanvas, } = require('canvas');

  // use npm canvas to create a display for the results
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const imgData = context.createImageData(width, height);

  // pass the image data from the work function into the imgData for the canvas
  for (let i = 0; i < set.length; i++) {
    imgData.data[i] = set[i];
  }
  // save the image to a file and add it to the gif (if applicable)
  context.putImageData(imgData, 0, 0);
  if (encoder) {
    encoder.addFrame(context);
  }
  if (settings && settings.SAVE_IMAGES) {
    const buffer = canvas.toBuffer('image/png');
    const fs = require('fs');
    fs.writeFileSync(imagePath, buffer);
  }
};

exports.displayFrame = function displayFrame(frameData) {
  const { width, height, set, } = frameData;
  // use npm canvas to create a display for the results
  const canvas = document.getElementById('canvas');
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
};

exports.createAndSaveFrame = function createAndSaveFrame(config, imagePath) {
  const frameData = exports.createFrame(config);

  exports.saveFrame(frameData, imagePath);
};

});
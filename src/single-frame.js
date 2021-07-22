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

const { createCanvas, } = require('canvas');
const fs = require('fs');

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
  const flatCleanedSet = cleanedSet.flat();

  // Need to get the most visited so we can scale image brightness accordingly
  // console.log(cleanedSet.length, cleanedSet[0].length)
  const countOfMostVisits = flatCleanedSet.reduce(function(a, b) {
    return Math.max(a, b);
  });

  // Needs to be updated to work better with higher iterations of the set.
  const colorFunc = function colorFunc(visits, mostVisits) {
    return [
      visits / mostVisits * 255,
      visits / mostVisits * 255,
      0];
  };

  const uint8Array = processCountsToColor(flatCleanedSet, width, height, countOfMostVisits, colorFunc);

  return {
    set: uint8Array,
    width,
    height,
  };
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
    fs.writeFileSync(imagePath, buffer);
  }
};

exports.createAndSaveFrame = function createAndSaveFrame(config, imagePath) {
  const frameData = exports.createFrame(config);

  exports.saveFrame(frameData, imagePath);
};

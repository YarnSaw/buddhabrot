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

const { generateAllPoints, } = require('./set-generation');
const { cleanupSet, drawCanvas, } = require('./image-generation');

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

  return {
    cleanedSet: flatCleanedSet,
    countOfMostVisits,
    width,
    height,
  };
};

exports.saveFrame = function saveFrame(frameData, imagePath) {
  const { cleanedSet, countOfMostVisits, width, height, } = frameData;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const colorFunc = (visits, mostVisits) => {
    return [
      visits / mostVisits * 255,
      visits / mostVisits * 255,
      0];
  };

  drawCanvas(context, cleanedSet, width, height, countOfMostVisits, colorFunc);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(imagePath, buffer);
};

exports.createAndSaveFrame = function createAndSaveFrame(config, imagePath) {
  const frameData = exports.createFrame(config);

  exports.saveFrame(frameData, imagePath);
};

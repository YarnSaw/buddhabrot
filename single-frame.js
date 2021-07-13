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

exports.createFrame = function createFrame(config) {
  // Find all the points for the set.
  const setPoints = generateAllPoints(config);
  // eslint-disable-next-line no-undef
  progress();
  // Process the points / prepare them for the image
  let cleanedSet = cleanupSet(setPoints, config);
  const width = cleanedSet[0].length;
  const height = cleanedSet.length;
  cleanedSet = cleanedSet.flat();

  // Need to get the most visited so we can scale image brightness accordingly
  // console.log(cleanedSet.length, cleanedSet[0].length)
  const countOfMostVisits = cleanedSet.reduce(function(a, b) {
    return Math.max(a, b);
  });

  return {
    cleanedSet,
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

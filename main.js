/**
 *  @file       main.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       July 2021
 *
 * Entrypoint for budhhabot generation
 */

/**
 * @typedef {import('./config.js').config} config
 */

'use strict';

const { createCanvas, } = require('canvas');
const fs = require('fs');

/** @type {config} */
const config = require('./config.js').init();
const { generateAllPoints, } = require('./set-generation');
const { cleanupSet, drawCanvas, } = require('./image-generation');

async function main() {
  // Find all the points for the set.
  const setPoints = generateAllPoints(config);

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
  console.log(`Most visits to a single pixel is ${countOfMostVisits}`);

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
  fs.writeFileSync('./img.png', buffer);
}

main();

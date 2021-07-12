
const { createCanvas } = require('canvas');
const fs = require('fs');

const config = require('./config.js').init();
const { generateAllPoints } = require('./set-generation');
const { cleanupSet } = require('./image-generation');

async function main() {
  const setPoints = generateAllPoints(config);

  let cleanedSet = cleanupSet(setPoints, config);
  let width = cleanedSet[0].length;
  let height = cleanedSet.length;
  cleanedSet = cleanedSet.flat();

  //Need to get the most visited so we can scale image brightness accordingly
  //console.log(cleanedSet.length, cleanedSet[0].length)
  let countOfMostVisits = cleanedSet.reduce(function(a, b) {
    return Math.max(a, b);
  });
  console.log(`Most visits to a single pixel is ${countOfMostVisits}`);

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  let imgData = context.createImageData(width, height);
 
  for (let i = 0; i < width * height; i++) {
    if (i % 100000 == 0) {
      console.log(`reached ${i} of ${width * height} total`)
    }
    imgData.data[i*4] = cleanedSet[i] / countOfMostVisits * 255
    imgData.data[i*4+3] = 255
  }
  
  
  context.putImageData(imgData, 0, 0);
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync('./img.png', buffer);
}


main();
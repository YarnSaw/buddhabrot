


const config = require('./config.js').init()

const { generateAllPoints } = require('./set-generation')

const { cleanupSet } = require('./image-generation')

async function main() {
  const setPoints = generateAllPoints(config);
  const cleanedSet = cleanupSet(setPoints, config);
  let countOfMostVisits = 0;
  //Need to get the most visited so we can scale image brightness accordingly
  //console.log(cleanedSet.length, cleanedSet[0].length)
  for (let row of cleanedSet) {
    countOfMostVisits = Math.max(countOfMostVisits, Math.max(...row))
  }
  console.log(countOfMostVisits)
}


main()
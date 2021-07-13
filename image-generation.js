/**
 * @typedef {import('./config.js').config} config
 */

/**
 * @param {Array.<number[]>} allPoints
 * @param {config} config
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
      const realScaledValue = Math.floor(Math.round(point[0] * imageScaleup) + -setDimensions.left * imageScaleup);
      const complexScaledValue = Math.floor(Math.round(point[1] * imageScaleup) + -setDimensions.down * imageScaleup);
      imagePointOccurances[complexScaledValue][realScaledValue]++;
    }
  }
  return imagePointOccurances;
};

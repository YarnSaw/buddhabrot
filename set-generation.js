/**
 * Calculates if a given point is in the mandelbrot, and if it isn't
 * will return the escape path.
 * @param {Array} startPoint
 * @param {object} config
 */
function calculatePath(startPoint, config) {
  const { iterations, escapeReal, escapeComplex, } = config;
  let realValueNew;
  let realValue = startPoint[0];
  let complexValue = startPoint[1];
  /** @type {Array.<number[]>} */
  const escapePath = [[realValue, complexValue]];

  for (let i = 0; i < iterations; i++) {
    realValueNew = realValue ** 2 - complexValue ** 2;
    complexValue = 2 * realValue * complexValue + startPoint[1];
    realValue = realValueNew + startPoint[0];

    if (Math.abs(realValue) > escapeReal || Math.abs(complexValue) > escapeComplex) {
      // The value has 'escaped' to infinity and thus it's path is in the buddhabrot
      return escapePath;
    }
    escapePath.push([realValue, complexValue]);
  }

  // eslint-disable-next-line no-useless-return
  return;
}
/**
 * @param {config} config
 * @returns
 */
exports.generateAllPoints = function findAllPaths(config) {
  const { setDimensions, calculationAccuracy, } = config;
  const accuracy = 1 / calculationAccuracy;
  const escapePaths = [];
  for (let height = setDimensions.up; height > setDimensions.down; height = height - accuracy) {
    for (let width = setDimensions.left; width < setDimensions.right; width = width + accuracy) {
      const path = calculatePath([width, height], config);
      if (path) {
        escapePaths.push(path);
      }
    }
  }
  return escapePaths.flat();
};

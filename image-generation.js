/**
 * 
 * @param {Array.<number[]>} allPoints 
 * @param {config} config 
 */
exports.cleanupSet = function cleanPoints(allPoints, config){
  const { imageScaleup, setDimensions } = config
  const width = imageScaleup * (setDimensions.right - setDimensions.left)+1;
  const height = imageScaleup * (setDimensions.up - setDimensions.down)+1;
  let widthArray = new Array(width).fill(0)
  //console.log(widthArray[widthArray.length-1])
  const imagePointOccurances = new Array(height).fill([].concat(widthArray))
  //console.log(imagePointOccurances[imagePointOccurances.length-1][imagePointOccurances[0].length-1])
  for (let point of allPoints) {
    if ( true 
      && point[0] > setDimensions.left 
      && point[0] < setDimensions.right
      && point[1] > setDimensions.down
      && point[1] < setDimensions.up) 
    {
        realScaledValue = Math.floor(Math.round(point[0] * imageScaleup) + -setDimensions.left * imageScaleup);
        complexScaledValue = Math.floor(Math.round(point[1] * imageScaleup)+ -setDimensions.down * imageScaleup);
        imagePointOccurances[complexScaledValue][realScaledValue]++;
    }
  }
  return imagePointOccurances;
}


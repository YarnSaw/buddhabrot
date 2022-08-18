
// @ts-ignore
module.declare(['./src/single-frame', './src/config', './src/set-generation'], function(require, exports, modules) {

/* globals dcp, keystore, generated */

let keystore;

let generated = false;
let dcpGenerated = false;
let generating = false;
// eslint-disable-next-line no-unused-vars
function downloadBrot(ev) {
  if (!generated) {
    alert("No image has been generated yet. Cannot download")
    ev.preventDefault();
    return;
  }
  if (dcpGenerated)
  {
    ev.preventDefault();
    window.encoder.download('download.gif');
  }
  else
  {
    const img = document.getElementById('canvasImg').toDataURL("image/png");
    document.getElementById('download').href = img;
  }
}

async function cleanupPreviousImage()
{
  // Remove previously generated image
  if (dcpGenerated)
  {
    const img = document.getElementById('dcpGenImg');
    if (img && img.parentNode)
      img.parentNode.removeChild(img);
  }
  else if (generated)
  {
    const img = document.getElementById('canvasImg');
    if (img && img.parentNode)
      img.parentNode.removeChild(img);
  }
  generating = true;
  generated = false;
  dcpGenerated = false;

  // Let browser remove previous image
  await new Promise((resolve, reject) =>  setTimeout(() => resolve(), 10));
}

function getConfig(ev)
{
  const defaultConfig = require('./src/config').init()

  const elements = ev.target.elements;

  if (elements.ownColorFunc.checked)
  {
    try
    {
      let func = eval(elements.colorFunction.value);
      func(1,10);
    }
    catch(e)
    {
      alert("There is a problem with your custom function, it doesn't evaluate / run properly.\nPlease ensure it takes 2 integer inputs: visits and mostVisits, and is a valid function.\nWill not run generation.");
      elements.colorFunction.disabled = true;
      elements.customColorFunc.checked
      elements.colorFunction.value = elements.colorFunction.textContent;
      return false;
    }
  }

  // Set defaults if the values are set to non-float values.
  const config = {
    ...defaultConfig,
    setDimensions: {
      up: parseFloat(elements.dimU.value) ? parseFloat(elements.dimU.value) : 1.1,
      down: parseFloat(elements.dimD.value) ? parseFloat(elements.dimD.value) : -1.1,
      left: parseFloat(elements.dimL.value) ? parseFloat(elements.dimL.value) : -1.5,
      right: parseFloat(elements.dimR.value) ? parseFloat(elements.dimR.value) : 0.75,
    },
    escapeDistance: parseFloat(elements.escapeDistance.value) ? parseFloat(elements.escapeDistance.value) : 3,
    iterations: parseFloat(elements.iterationsSingle.value) ? parseFloat(elements.iterationsSingle.value) : 100,
    calculationAccuracy: parseFloat(elements.calcAcc.value) ? parseFloat(elements.calcAcc.value) : 300,
    imageScaleup: parseFloat(elements.imageScaleup.value) ? parseFloat(elements.imageScaleup.value) : 300,
    colorFunction: eval(elements.colorFunction.value),
    asyncGen: elements.asyncGen.checked,
  };
  config.calcDimensions = config.setDimensions;

  if (!elements.useSmoothing.checked)
    delete config.smoothingKernel;
  
  /* example quadratic color function, makes the colors pop a bit more */
  // config.colorFunction = (visits, mostVisits) => {
  //   return [
  //     Math.sqrt(visits) / Math.sqrt(mostVisits) * 255,
  //     Math.sqrt(visits) / Math.sqrt(mostVisits) * 255,
  //     0
  //   ]
  // }


  return config;
}

async function deployDCPJob(config, elements)
{
  // Ensure keystore is loaded
  if (!keystore)
  {
    keystore = await dcp.wallet.get();
    document.getElementById("keystoreLabel").style.display = 'none';
    document.getElementById("keystoreFile").style.display = 'none';
  }

  // Can't pass functions over dcp, so need to stringify colorFunction
  // config.colorFunction = config.colorFunction.toString();

  const compute = dcp.compute;
  const workFunction = function work(setGenParams, config) {
    config.iterations = setGenParams.iterations;
    config.segmentNumber = setGenParams.segmentNumber;
    config.totalSegments = setGenParams.totalSegments;
    config.dcp = true;
    const { createFrame, } = require('single-frame.js');
    return createFrame(config);
  };

  const inputSet = function* generator()
  {
    for (let i = 0; i < 400; i++)
      yield { iterations: 10000, segmentNumber: i, totalSegments: 400 };
  }

  config.asyncGen = false;
  config.colorImage = false;
  const job = compute.for(
    inputSet(), workFunction, [config]
  );

  job.on('accepted', () => {
    console.log(` - Job accepted by scheduler, waiting for results`);
    console.log(` - Job has id ${job.id}`);
  });

  job.on('readystatechange', (arg) => {
    document.getElementById("DCPstatus").textContent = "Ready state of job: " + arg;
    console.log(`new ready state: ${arg}`);
  });

  job.on('error', (ev) => {
    console.log(ev);
  });

  document.getElementById("DCPresults").textContent = `0  / ${job.jobInputData.length} slices computed.`
  // var resultsReceived = 0
  // job.on('result', (ev) => {
  //   resultsReceived++;
  //   document.getElementById("DCPresults").textContent = `Received ${resultsReceived} slice(s).`
  //   console.log("Got a result", ev.sliceNumber);
  // });

  async function updateResultStats()
  {
    const info = await compute.getJobInfo(job.id);
    document.getElementById("DCPresults").textContent = `${info.completedSlices} / ${job.jobInputData.length} slices computed.`;
  }
  const updateResInterval = setInterval(updateResultStats, 10 * 1000);

  job.collateResults = false;
  job.requires(['buddhabrot_yarn/single-frame.js']);
  job.public.name = `buddhabrot generation @ ${Date.now()}`;
  job.setPaymentAccountKeystore(keystore);

  if (elements.joinKey.value && elements.joinSecret.value)
  {
    job.computeGroups = [{ joinKey: elements.joinKey.value, joinSecret: elements.joinSecret.value }]
  }

  if (document.getElementById("localExec").checked)
    await job.localExec();
  else
    await job.exec(compute.marketValue);
  clearInterval(updateResInterval);

  return job.id;
}

/**
 * Will be used in the future when generating actual gifs, multiple stages of images. Needs to be integrated
 * into fetchResultsAndConstructImage to only load some of the images at a time.
 */
function processDCPResults(results, colorFunction)
{
  const { processCountsToColor, concatenateSets } = require('./src/set-generation');
  const width = results[0].width;
  const height = results[0].height;

  const processedResults = []
  while (results.length)
  {
    const currentIter = results[0].iterations;
    const segmentsOfImage = results.filter(res => res.iterations === currentIter);
    results.splice(0, segmentsOfImage.length);
    const fullSet = concatenateSets(...(segmentsOfImage.map(seg => seg.set)));
    const countOfMostVisits = fullSet.reduce(function(a, b) {
      return Math.max(a, b);
    }); 

    processedResults.push(processCountsToColor(fullSet, width, height, countOfMostVisits, colorFunction));

  }

  return processedResults;
}

async function fetchResultsAndConstructImage(jobId, colorFunction)
{
  const { processCountsToColor, concatenateSets } = require('./src/set-generation');


  const info = await dcp.compute.getJobInfo(jobId);
  const totalSlices = info.totalSlices;
  const fetches = Math.floor(totalSlices/50);
  let resultArrays = [];
  let firstIter = true;

  const ks = await dcp.wallet.get();
  const conn = new dcp.protocol.Connection(dcpConfig.scheduler.services.resultSubmitter.location, ks);

  for (let i = 0; i < fetches; i++)
  {
    const { success, payload } = await conn.send('fetchResult', {
      job: jobId,
      owner: (await dcp.wallet.get()).address,
      range: new dcp['range-object'].RangeObject(i*50, (i+1)*50 - 1 /* values are inclusive */),
    }, ks);
    let results = [];
    console.log(`${i+1} fetch done with success ${success}. Fetching data now.`)
    await Promise.all(payload.map(async r => {
      results.push(await dcp.utils.fetchURI(decodeURIComponent(r.value), [dcpConfig.scheduler.location.origin]));
    }));
    console.log('Concatenating all fetched results.')
    resultArrays.push(concatenateSets(...(results.map(res => res.set))));
  }
  // Get the remainder of slices
  const { success, payload } = await conn.send('fetchResult', {
    job: jobId,
    owner: (await dcp.wallet.get()).address,
    range: new dcp['range-object'].RangeObject(fetches * 50, totalSlices),
  }, ks);

  let results = [];
  await Promise.all(payload.map(async r => {
    results.push(await dcp.utils.fetchURI(decodeURIComponent(r.value), [dcpConfig.scheduler.location.origin]));
  }));

  resultArrays.push(concatenateSets(...(results.map(res => res.set))));

  const overalResult = concatenateSets(...resultArrays);
  const countOfMostVisits = overalResult.reduce(function(a, b) {
    return Math.max(a, b);
  }); 

  const width = results[0].width;
  const height = results[0].height;

  return {width, height, processedResults: [processCountsToColor(overalResult, width, height, countOfMostVisits, colorFunction)]};
}

async function generateImage(ev) {
  ev.preventDefault();
  if (generating)
  {
    alert("Cannot generate image when one is already being generated");
    return;
  }

  await cleanupPreviousImage();

  const config = getConfig(ev);
  if (!config)
    return;
  
  if (document.getElementById("useDCP").checked)
  {
    const idKs = await dcp.wallet.get({name: 'id'});
    dcp.wallet.addId(idKs);
    const jobId = await deployDCPJob(config, ev.target.elements);
    console.log("Job is complete, processing image now");
    const { processedResults, width, height } = await fetchResultsAndConstructImage(jobId, config.colorFunction);
    console.log('Processing image to gif');

    document.getElementById("DCPresults").textContent = '';
    document.getElementById("DCPstatus").textContent = '';

    // Display results as a gif
    const encoder = new GIFEncoder();
    window.encoder = encoder; // expose the encoder so I can later download from it.
    encoder.setRepeat(0);
    encoder.setDelay(50);
    encoder.setSize(width, height);
    encoder.start()
    for (let element of processedResults)
      encoder.addFrame(element, true);
    encoder.finish();

    const binaryGif = encoder.stream().getData();
    const dataURL = 'data:image/fig;base64,' + window.btoa(binaryGif);
    const img = document.createElement("img");
    img.id = "dcpGenImg"
    img.src = dataURL;
    document.getElementById('imageDiv').appendChild(img);

    dcpGenerated = true;
  }
  else 
  {
    document.getElementById("generatingIndicator").textContent = "Generating Image Locally...";
    
    // Alow browser to update text before fully sync operation. In the future should probably use a web worker for this.
    setTimeout(async () => {
      const { createFrame, displayFrame, } = require('./src/single-frame');
      const frame = await createFrame(config);

      const { processCountsToColor } = require('./src/set-generation');
      if (typeof config.colorFunction === 'string')
        config.colorFunction = eval(config.colorFunction);
      frame.set = processCountsToColor(frame.set, frame.width, frame.height, frame.countOfMostVisits, config.colorFunction);

      displayFrame(frame);
      document.getElementById("generatingIndicator").textContent = "";
      document.getElementById('progress').textContent = "";
    }, 10);
    
  }
  generated = true;
  generating = false;
}

function setupListeners() {
  const wallet = dcp.wallet; // DCP specific class - wallets

  // Set keystore when selected and remove the upload button
  const keystoreLoaderLabel = document.getElementById("keystoreLabel");
  const keystoreLoader = document.getElementById("keystoreFile");
  keystoreLoader.addEventListener('click', async(ev) => {
    ev.preventDefault();
    keystore = await wallet.get();
    keystoreLoader.style.display = 'none';
    keystoreLoaderLabel.style.display = 'none';
  });

  // When new function for color is defined, verify the function will actually work and alert if it won't
  const colorFunction = document.getElementById("colorFunction");
  colorFunction.addEventListener('focusout', async(ev) => {
    try
    {
      let func = eval(colorFunction.value);
      func(1,10);
    }
    catch(e)
    {
      alert("There is a problem with your custom function, it doesn't evaluate/ run properly.\nPlease ensure it takes 2 integer inputs: visits and mostVisits, and is a valid function.");
    }
  });

  // Enable and disable custom color func box by checkbox
  const customColorFunc = document.getElementById("ownColorFunc");
  customColorFunc.addEventListener('click', async(ev) => {
    colorFunction.disabled = !customColorFunc.checked;
    colorFunction.value = colorFunction.textContent;
  });

  document.getElementById('form').addEventListener('submit', generateImage);
  document.getElementById('download').addEventListener('click', downloadBrot);
}

if (['interactive', 'complete'].includes(document.readyState))
  setupListeners();
else
  window.addEventListener('DOMContentLoaded', (ev) => {
    setupListeners();
  });

});
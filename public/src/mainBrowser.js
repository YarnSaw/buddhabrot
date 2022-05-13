
// @ts-ignore
module.declare(['./src/single-frame', './src/config'], function(require, exports, modules) {


/* globals dcp, keystore, generated */

let keystore;

let generated = false;
// eslint-disable-next-line no-unused-vars
function downloadBrot(ev) {
  if (!generated) {
    if (!confirm("No image has been generated yet. Are you sure you wish to download the canvas image?")) {
      ev.preventDefault();
      return;
    }
  }
  const img = document.getElementById('canvas').toDataURL("image/png");
  document.getElementById('download').href = img;
}

async function generateImage(ev) {
  ev.preventDefault();
  const { createFrame, displayFrame, } = require('./src/single-frame');
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
      return;
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
  };

  if (!elements.useSmoothing.checked)
    delete config.smoothingKernel;

  if (document.getElementById("useDCP").checked)
  {
    const compute = dcp.compute;
    const workFunction = function work(iter, config) {
      config.iterations = iter;
      config.dcp = true;
      const { createFrame, } = require('./single-frame');
      return createFrame(config);
    };

    const job = compute.for(
      1, 2, workFunction, [config]
    );

    job.on('accepted', () => {
      console.log(` - Job accepted by scheduler, waiting for results`);
      console.log(` - Job has id ${job.id}`);
    });

    job.on('readystatechange', (arg) => {
      console.log(`new ready state: ${arg}`);
    });

    job.on('result', (ev) => {
      console.log("Got a result", ev.sliceNumber);
    });

    job.on(('error'), (ev) => {
      console.log(ev);
    });

    job.requires('./single-frame');
    // job.computeGroups = [{ joinKey: '', joinSecret: '', }];
    job.public.name = "buddhabrot generation";
    job.setPaymentAccountKeystore(keystore);

    let results;
    if (document.getElementById("localExec").checked) {
      results = await job.localExec();
    } else {
      results = await job.exec(compute.marketValue);
    }

    results = Array.from(results);
    displayFrame(results[0]);
  }
  else 
  {
    const frame = createFrame(config);
    displayFrame(frame);
  }
  generated = true;
}
function main() {
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
  main();
else
  window.addEventListener('DOMContentLoaded', (ev) => {
    main();
  });

});
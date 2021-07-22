/**
 *  @file       main.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       July 2021
 *
 * Entry point for buddhabrot generation
 */

/**
 * @typedef {import('./config.js').config} config
 * @typedef {import('./settings.js').settings} settings
 */

'use strict';

/** @type {settings} */
const settings = require('./settings').init();

/** @type {config} */
const config = require('./config.js').init();

const { createAndSaveFrame, saveFrame, } = require('./single-frame.js');

async function main(settings, imagePath = './img.png') {
  if (settings.DCP) {
    await require('dcp-client').init();
    // @ts-ignore
    const compute = require('dcp/compute');
    // @ts-ignore
    const wallet = require('dcp/wallet');

    const workFunction = function work(iter, config) {
      config.iterations = iter;
      config.dcp = true;
      const { createFrame, } = require('./single-frame');
      return createFrame(config);
    };

    // The range for work will decide the number of iterations that will be computed in each slice
    const job = compute.for(
      1, 100, workFunction, [config]
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

    job.requires('./single-frame');
    job.computeGroups = [{ joinKey: 'wyld-stallyns', joinSecret: 'QmUgZXhjZWxsZW50IHRvIGVhY2ggb3RoZXIK', }];
    job.public.name = "buddhabrot generation";
    const ks = await wallet.get();
    job.setPaymentAccountKeystore(ks);

    let results;
    if (settings.DCP_LOCALEXEC) {
      results = await job.localExec();
    } else {
      results = await job.exec(0.0001);
    }

    results = Array.from(results);

    if (settings.CREATE_GIF) {
      createGif(results, settings);
    } else {
      for (let i = 0; i < results.length; i++) {
        saveFrame(results[i], `./img/img${i}.png`);
      }
    }
  } else {
    // Not running on dcp, create a single frame based off the config specs
    createAndSaveFrame(config, imagePath);
  }
}

/**
 * Collate results into a gif and possibly also save individual images
 * @param {object} results - aarray of results from many uses of createFrame
 * @param {object} settings - environment settings
 */
function createGif(results, settings) {
  const fs = require('fs');
  const GIFEncoder = require('gifencoder');
  const encoder = new GIFEncoder(results[0].width, results[0].height);
  encoder.createReadStream().pipe(fs.createWriteStream(settings.PATH_TO_GIF));
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(200);
  for (let i = 0; i < results.length; i++) {
    saveFrame(results[i], `./img/img${i}.png`, encoder, settings);
  }
  encoder.finish();
}

main(settings);

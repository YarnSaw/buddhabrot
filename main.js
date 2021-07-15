/**
 *  @file       main.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       July 2021
 *
 * Entry point for buddhabrot generation
 */

/**
 * @typedef {import('./config.js').config} config
 */

'use strict';

require('dotenv').config();

/** @type {config} */
const config = require('./config.js').init();

const { createAndSaveFrame, } = require('./single-frame.js');

async function main(dcp, imagePath = './img.png') {
  if (dcp) {
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
      [100], workFunction, [config]
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
    // job.computeGroups = [{ joinKey: '', joinSecret: '', }];
    job.public.name = "buddhabrot generation";
    const ks = await wallet.get();
    job.setPaymentAccountKeystore(ks);

    let results = await job.localExec();
    results = Array.from(results);

    for (let i = 0; i < results.length; i++) {
      const { saveFrame, } = require('./single-frame.js');
      saveFrame(results[i], `./img/img${i}.png`);
    }
  } else {
    // Not running on dcp, create a single frame based off the config specs
    createAndSaveFrame(config, imagePath);
  }
}

const DCP = process.env.DCP === 'y';
main(DCP);

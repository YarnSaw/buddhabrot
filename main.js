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

require('dotenv').config();

/** @type {config} */
const config = require('./config.js').init();
// const { generateAllPoints, } = require('./set-generation');
// const { cleanupSet, drawCanvas, } = require('./image-generation');
const { createAndSaveFrame, } = require('./single-frame.js');

async function main(dcp, imagePath = './img.png') {
  if (dcp) {
    await require('dcp-client').init();
    const compute = require('dcp/compute');
    const wallet = require('dcp/wallet');

    const workFunction = function work(iter, config) {
      config.iterations = iter;
      config.dcp = true;
      const { createFrame, } = require('./single-frame');
      return createFrame(config);
    };

    const job = compute.for(
      [10, 20], workFunction, [config]
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
    let results = await job.exec();
    results = Array.from(results);

    for (let i = 0; i < results.length; i++) {
      const { saveFrame, } = require('./single-frame.js');
      saveFrame(results[i], `./img/img${i}.png`);
    }
  } else {
    createAndSaveFrame(config, imagePath);
  }
}

main(process.env.DCP === 'true');

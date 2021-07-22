/**
 * @file settings.js
 * @author Ryan Saweczko, yarn.sawe@gmail.com
 * @date July 2021
 *
 * Settings for the generator
 */

'use strict';

/**
 * @typedef settings
 * @type {object}
 * @property {boolean} DCP - run using dcp
 * @property {boolean} DCP_LOCALEXEC - use localexec if running on dcp
 * @property {boolean} CREATE_GIF - create gif from generated images
 * @property {string} PATH_TO_GIF - path to save gif to
 * @property {boolean} SAVE_IMAGES - save each individual image to ./img/*
 */

/**
 * Get various settings not directly related to the creation
 * of the buddhabrot
 * @returns {settings}
 */
exports.init = function init() {
  return {
    DCP: true,
    DCP_LOCALEXEC: true,
    CREATE_GIF: true,
    PATH_TO_GIF: 'img/buddhabrot.gif',
    SAVE_IMAGES: true,
  };
};

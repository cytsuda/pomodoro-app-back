'use strict';

/**
 * sound service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::sound.sound');

'use strict';

/**
 * pomo service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::pomo.pomo');

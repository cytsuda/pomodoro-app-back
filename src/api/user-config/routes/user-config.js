'use strict';

/**
 * user-config router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::user-config.user-config');

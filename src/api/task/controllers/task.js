"use strict";
const { parseBody } = require("../../utils");
/**
 *  task controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

const _ = require("lodash");

module.exports = createCoreController("api::task.task", ({ strapi }) => ({
  /**
   * Create a record.
   *
   * @return {Object}
   */

  // this works
  async create(ctx) {
    const { query } = ctx.request;
    const { data, files } = parseBody(ctx);
    data.user = ctx.state.user.id;
    console.log(data);
    if (!_.isObject(data)) {
      throw new ValidationError('Missing "data" payload in the request body');
    }

    const sanitizedInputData = await this.sanitizeInput(data, ctx);
    console.log(sanitizedInputData);

    const entity = await strapi
      .service("api::task.task")
      .create({ ...query, data: sanitizedInputData, files });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },

  async find(ctx) {
    const { query } = ctx;
    const possibleFilters = query.filters;
    query.filters = {
      ...possibleFilters,
      user: {
        id: {
          $eq: ctx.state.user.id,
        },
      },
    };
    const props = await strapi.service("api::task.task").find(query);
    const { results, pagination } = props;
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },
}));
/*
{ user: { id: { '$eq': '1' } } }
*/

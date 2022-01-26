"use strict";

const { parseBody } = require("../../utils");
const moment = require("moment");
const _ = require("lodash");
/**
 *  pomo controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::pomo.pomo", ({ strapi }) => ({
  /**
   * Create a record.
   *
   * @return {Object}
   */

  // this works
  async create(ctx) {
    const { query } = ctx.request;
    const { data, files } = parseBody(ctx);
    // is data
    const pomoConfig = ctx.state.user.pomoConfig;

    data.user = ctx.state.user.id;
    if (!_.isObject(data)) {
      throw new ValidationError('Missing "data" payload in the request body');
    }
    // TODO - add search and see if the pomo is running
    if (data.type === "work") {
      data.end = moment(data.start)
        .add(pomoConfig.workDuration, "m")
        .utc()
        .format();
      data.status = "running";
    }
    const sanitizedInputData = await this.sanitizeInput(data, ctx);
    console.log(sanitizedInputData);

    const entity = await strapi
      .service("api::pomo.pomo")
      .create({ ...query, data: sanitizedInputData, files });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { query } = ctx.request;
    const { data, files } = parseBody(ctx);

    if (!_.isObject(data)) {
      throw new ValidationError('Missing "data" payload in the request body');
    }

    const pomo = await await strapi.service("api::pomo.pomo").findOne(id, {});
    console.log(pomo);
    if (moment(moment().utc().format()).isBefore(pomo.end)) {
      console.log("Pomo vai ser cancelado");
      data.status = "canceled";
    } else {
      console.log("Pomo foi finalizado");
      data.status = "completed";
    }
    // `finish` is the flag to "complete" or "cancel"
    // `pauseTime` is the flag to "pause", "pauseTime" can't be with "finish" an
    // erro should be trigger, if client force pauseTime and finish the server will cancel
    // current pomo
    console.log(data);
    const sanitizedInputData = await this.sanitizeInput(data, ctx);
    console.log(sanitizedInputData);

    const entity = await strapi
      .service("api::pomo.pomo")
      .update(id, { ...query, data: sanitizedInputData, files });
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
    const props = await strapi.service("api::pomo.pomo").find(query);
    const { results, pagination } = props;
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },
}));

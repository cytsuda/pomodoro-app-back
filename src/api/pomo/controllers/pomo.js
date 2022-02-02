"use strict";

const { parseBody } = require("../../utils");
const moment = require("moment");
const _ = require("lodash");
/**
 *  pomo controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

const timeType = "s";
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
    // [ ] need to recovery the pomoconfig from the userConfigs
    const findQuery = {
      filters: {
        user: {
          id: {
            $eq: ctx.state.user.id,
          },
        },
      },
    };
    const foundUserConfig = await strapi
      .service("api::user-config.user-config")
      .find(findQuery);
    data.user = ctx.state.user.id;

    const { pomoConfig } = foundUserConfig.results[0];

    if (!_.isObject(data)) {
      throw new ValidationError('Missing "data" payload in the request body');
    }

    // TODO - Cannot create another pomo if there is a pomo running, search for pomos (usersID) running
    if (data.type === "work") {
      data.end = moment(data.start)
        .add(pomoConfig.workDuration, timeType)
        .utc()
        .format();
      data.status = "running";
    }
    if (data.type === "short_break") {
      data.end = moment(data.start)
        .add(pomoConfig.shortBreak, timeType)
        .utc()
        .format();
      data.status = "running";
    }
    if (data.type === "long_break") {
      data.end = moment(data.start)
        .add(pomoConfig.longBreak, timeType)
        .utc()
        .format();
      data.status = "running";
    }
    const sanitizedInputData = await this.sanitizeInput(data, ctx);

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

    if (data.finish) {
      if (moment(moment().utc().format()).isBefore(pomo.end)) {
        // Pomo is canceled
        data.status = "canceled";
      } else {
        // Pomo is completed
        data.status = "completed";
      }
    }
    if (data.reset) {
      //Reset to running status"
      data.status = "running";
    }
    // `finish` is the flag to "complete" or "cancel"
    // `pauseTime` is the flag to "pause", "pauseTime" can't be with "finish" an
    // erro should be trigger, if client force pauseTime and finish the server will cancel
    // current pomo
    const sanitizedInputData = await this.sanitizeInput(data, ctx);

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

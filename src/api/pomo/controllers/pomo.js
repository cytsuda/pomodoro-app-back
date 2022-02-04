"use strict";

const { parseBody } = require("../../utils");
const moment = require("moment");
const _ = require("lodash");
/**
 *  pomo controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

const durationLength = "s";
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
    const findQuery = {
      filters: {
        user: {
          id: {
            $eq: ctx.state.user.id,
          },
        },
      },
    };
    const userConfig = await strapi
      .service("api::user-config.user-config")
      .find(findQuery);

    if (userConfig.results.length !== 1 || !ctx.state.user.id) {
      return ctx.badRequest("User config not found");
    }

    if (!_.isObject(data)) {
      return ctx.badRequest('Missing "data" payload in the request body');
    }

    const findrunning = {
      filters: {
        status: "running",
        user: {
          id: {
            $eq: ctx.state.user.id,
          },
        },
      },
    };

    const { results: pomos } = await strapi
      .service("api::pomo.pomo")
      .find(findrunning);

    if (pomos.length > 0) {
      return ctx.badRequest("There is already a snitch running ");
    }

    data.user = ctx.state.user.id;
    const { pomoConfig } = userConfig.results[0];

    let end;
    if (data.type === "work") {
      end = moment(data.start)
        .add(pomoConfig.workDuration, durationLength)
        .utc()
        .format();
      data.status = "running";
    } else if (data.type === "short_break") {
      end = moment(data.start)
        .add(pomoConfig.shortBreakDuration, durationLength)
        .utc()
        .format();
      data.status = "running";
    } else if (data.type === "long_break") {
      end = moment(data.start)
        .add(pomoConfig.longBreakDuration, durationLength)
        .utc()
        .format();
      data.status = "running";
    }
    if (!_.isEqual(end, data.end)) {
      return ctx.badRequest("Something is wrong: end date is not valid");
    }
    const sanitizedInputData = await this.sanitizeInput(data, ctx);
    const entity = await strapi
      .service("api::pomo.pomo")
      .create({ ...query, data: sanitizedInputData, files });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },

  // Update - Here
  async update(ctx) {
    const { id } = ctx.params;
    const { query } = ctx.request;
    const { data, files } = parseBody(ctx);

    if (!_.isObject(data)) {
      throw new ValidationError('Missing "data" payload in the request body');
    }
    const pomo = await strapi.service("api::pomo.pomo").findOne(id, {});

    if (data.finish) {
      if (moment(moment().utc().format()).isBefore(pomo.end)) {
        // Pomo is canceled
        data.status = "canceled";
      } else {
        // Pomo is completed
        data.status = "completed";
        if (pomo.type === "work" && data.tasks.length > 0) {
          data.tasks.map(async (task) => {
            const { id: taskID, attributes } = task;
            if (attributes.complete === true) {
              try {
                const newAttributes = attributes;
                newAttributes.completeDate = moment().utc().format();
                if (attributes.sub_tasks.data.length <= 0) {
                  newAttributes.sub_tasks = null;
                }
                const sanitizedInputTaskData = await this.sanitizeInput(
                  newAttributes,
                  ctx
                );

                const entityTask = await strapi
                  .service("api::task.task")
                  .update(taskID, { data: sanitizedInputTaskData });
              } catch (err) {
                console.log("[ERROR]");
                console.log(err);
              }
            } else {
              try {
                const newAttributes = attributes;
                newAttributes.completeDate = null;
                newAttributes.intermediate = false;
                if (attributes.sub_tasks.data.length <= 0) {
                  newAttributes.sub_tasks = null;
                }
                const sanitizedInputTaskData = await this.sanitizeInput(
                  newAttributes,
                  ctx
                );

                const entityTask = await strapi
                  .service("api::task.task")
                  .update(taskID, { data: sanitizedInputTaskData });
              } catch (err) {
                console.log("[ERROR]");
                console.log(err);
              }
            }
          });
        }
      }
    }
    if (data.reset) {
      //Reset to running status"
      data.status = "running";
    }
    ctx.body = "Okey";
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
    query.pagination = {
      pageSize: 100,
    };
    const props = await strapi.service("api::pomo.pomo").find(query);
    const { results, pagination } = props;
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },
}));

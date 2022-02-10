"use strict";

/**
 *  user-config controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::user-config.user-config",
  ({ strapi }) => ({
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
      const props = await strapi
        .service("api::user-config.user-config")
        .find(query);
      if (props.results > 1) {
        throw Error("FUCK WHATS GOING ON");
      }

      // Create pomo config if don't exist
      if (props.results.length === 0) {
        const data = {
          pomoConfig: {
            longBreakDuration: 15,
            shortBreakDuration: 5,
            workDuration: 25,
            pomoBeforeLongBreak: 4,
          },
          goalsConfig: {
            daily: 8,
            weekly: 40,
            monthly: 160,
          },
          user: ctx.state.user.id,
        };
        const sanitizedInputData = await this.sanitizeInput(data, ctx);
        const entity = await strapi
          .service("api::user-config.user-config")
          .create({ data: sanitizedInputData });
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
      }
      // If pomoConfig is find but dont have pomoConfig
      if (!props.results[0].pomoConfig) {
        const id = ctx.state.user.id;
        const data = {
          pomoConfig: {
            longBreakDuration: 15,
            shortBreakDuration: 5,
            workDuration: 25,
            pomoBeforeLongBreak: 4,
          },
        };
        // If pomoConfig is find but don't have goalsConfig
        if (
          !props.results[0].goalsConfig ||
          !props.results[0].goalsConfig.daily
        ) {
          const id = ctx.state.user.id;
          const data = {
            goalsConfig: {
              daily: 8,
              weekly: 40,
              monthly: 160,
            },
          };
        }
        // If pomoConfig is find but don't have preferenceConfig
        // if (!props.results[0].preferenceConfig) {
        //   const id = ctx.state.user.id;
        //   const data = {
        //     preferenceConfig: {},
        //   };
        // }
        // sanitizedInputData
        const sanitizedInputData = await this.sanitizeInput(data, ctx);
        const entity = await strapi
          .service("api::user-config.user-config")
          .update(id, { ...query, data: sanitizedInputData, files });
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

        return this.transformResponse(sanitizedEntity);
      }
      const res = props.results.length <= 0 ? {} : props.results[0];
      // Normal version
      // const { results, pagination } = props;
      // const sanitizedResults = await this.sanitizeOutput(results, ctx);
      // return this.transformResponse(sanitizedResults, { pagination });
      const sanitizedResults = await this.sanitizeOutput(res, ctx);
      return this.transformResponse(sanitizedResults);
    },
  })
);

"use strict";
const _ = require("lodash");
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
      if (props.results.length > 0 && props.results.length <= 1) {
        const userConfigId = props.results[0].id;
        let newData = {};
        if (!props.results[0].pomoConfig) {
          newData = {
            pomoConfig: {
              longBreakDuration: 15,
              shortBreakDuration: 5,
              workDuration: 25,
              pomoBeforeLongBreak: 4,
            },
          };
        }
        if (!props.results[0].goalsConfig) {
          newData = {
            ...newData,
            goalsConfig: {
              daily: 8,
              weekly: 40,
              monthly: 160,
            },
          };
        }
        if (!props.results[0].preferenceConfig) {
          newData = {
            ...newData,
            preferenceConfig: {
              sounds: {
                work: {
                  title: "hero decorative celebration 01",
                  url: "/uploads/hero_decorative_celebration_01_b55282f205.wav",
                },
                short: {
                  title: "hero decorative celebration 01",
                  url: "/uploads/hero_decorative_celebration_01_b55282f205.wav",
                },
                long: {
                  title: "hero decorative celebration 01",
                  url: "/uploads/hero_decorative_celebration_01_b55282f205.wav",
                },
              },
            },
          };
        }
        if (!_.isEqual(newData, {})) {
          const sanitizedInputData = await this.sanitizeInput(newData, ctx);
          const entity = await strapi
            .service("api::user-config.user-config")
            .update(userConfigId, { data: sanitizedInputData });
          const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
          return this.transformResponse(sanitizedEntity);
        } else {
          const { results, pagination } = props;
          const sanitizedResults = await this.sanitizeOutput(results, ctx);
          return this.transformResponse(sanitizedResults, { pagination });
        }
      }

      // Normal version
      const { results, pagination } = props;
      const sanitizedResults = await this.sanitizeOutput(results, ctx);
      return this.transformResponse(sanitizedResults, { pagination });
    },
  })
);

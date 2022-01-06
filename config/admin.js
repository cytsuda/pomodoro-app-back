module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '6964578d1ba5a03e90a5f758680cf474'),
  },
});

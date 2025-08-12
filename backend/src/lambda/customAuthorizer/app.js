// backend/src/lambda/customAuthorizer/app.js
const crypto = require('crypto');

exports.lambdaHandler = async (event, context) => {
  const secretHeader = process.env.CLOUDFRONT_SECRET_HEADER;
  const incomingSecret = event.headers['x-cloudfront-secret'];

  const isAuthorized =
    secretHeader &&
    incomingSecret &&
    Buffer.from(secretHeader).length === Buffer.from(incomingSecret).length &&
    crypto.timingSafeEqual(Buffer.from(secretHeader), Buffer.from(incomingSecret));

  if (!isAuthorized) {
    console.log('Forbidden: Missing or incorrect secret header.');
  }

  return {
    isAuthorized: isAuthorized,
  };
};

// backend/src/lambda/customAuthorizer/app.js
exports.lambdaHandler = async (event, context) => {
  const secretHeader = process.env.CLOUDFRONT_SECRET_HEADER;
  const incomingSecret = event.headers['x-cloudfront-secret'];

  let effect = 'Deny';
  if (
    secretHeader &&
    incomingSecret &&
    Buffer.from(secretHeader).length === Buffer.from(incomingSecret).length &&
    require('crypto').timingSafeEqual(Buffer.from(secretHeader), Buffer.from(incomingSecret))
  ) {
    effect = 'Allow';
  } else {
    console.log('Forbidden: Missing or incorrect secret header.');
  }

  const policy = {
    principalId: 'user', // The principal user identification associated with the token sent by the client.
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: event.methodArn,
        },
      ],
    },
  };

  return policy;
};

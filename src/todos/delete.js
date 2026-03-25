const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient(
  process.env.IS_OFFLINE ? { endpoint: 'http://localhost:8000', region: 'localhost', credentials: { accessKeyId: 'local', secretAccessKey: 'local' } } : {}
);
const docClient = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  const { id } = event.pathParameters;

  try {
    await docClient.send(new DeleteCommand({
      TableName: process.env.TODOS_TABLE,
      Key: { id },
      ConditionExpression: 'attribute_exists(id)',
    }));
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Todo not found' }),
      };
    }
    throw err;
  }

  return {
    statusCode: 204,
    body: null,
  };
};

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient(
  process.env.IS_OFFLINE ? { endpoint: 'http://localhost:8000', region: 'localhost', credentials: { accessKeyId: 'local', secretAccessKey: 'local' } } : {}
);
const docClient = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  const { id } = event.pathParameters;

  const result = await docClient.send(new GetCommand({
    TableName: process.env.TODOS_TABLE,
    Key: { id },
  }));

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Todo not found' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result.Item),
  };
};

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient(
  process.env.IS_OFFLINE ? { endpoint: 'http://localhost:8000', region: 'localhost', credentials: { accessKeyId: 'local', secretAccessKey: 'local' } } : {}
);
const docClient = DynamoDBDocumentClient.from(client);

module.exports.handler = async () => {
  const result = await docClient.send(new ScanCommand({
    TableName: process.env.TODOS_TABLE,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
  };
};

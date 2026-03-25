const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient(
  process.env.IS_OFFLINE ? { endpoint: 'http://localhost:8000', region: 'localhost', credentials: { accessKeyId: 'local', secretAccessKey: 'local' } } : {}
);
const docClient = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!data.text || typeof data.text !== 'string') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '"text" field is required and must be a string' }),
    };
  }

  const item = {
    id: uuidv4(),
    text: data.text.trim(),
    checked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({
    TableName: process.env.TODOS_TABLE,
    Item: item,
  }));

  return {
    statusCode: 201,
    body: JSON.stringify(item),
  };
};

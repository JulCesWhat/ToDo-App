import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

const client = new DynamoDBClient(
  process.env.IS_OFFLINE ? { endpoint: 'http://localhost:8000', region: 'localhost', credentials: { accessKeyId: 'local', secretAccessKey: 'local' } } : {}
);
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const userId = event.requestContext.authorizer.claims.sub;
  const { id } = event.pathParameters;

  try {
    await docClient.send(new DeleteCommand({
      TableName: process.env.TODOS_TABLE,
      Key: { userId, id },
      ConditionExpression: 'attribute_exists(userId)',
    }));
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Todo not found' }) };
    }
    throw err;
  }

  return { statusCode: 204, headers, body: null };
};

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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
  let data;

  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (data.text !== undefined && typeof data.text !== 'string') {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '"text" must be a string' }) };
  }

  if (data.checked !== undefined && typeof data.checked !== 'boolean') {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '"checked" must be a boolean' }) };
  }

  try {
    const result = await docClient.send(new UpdateCommand({
      TableName: process.env.TODOS_TABLE,
      Key: { userId, id },
      // 'text' is a DynamoDB reserved word — use an expression attribute name
      UpdateExpression: 'SET #txt = :text, checked = :checked, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#txt': 'text' },
      ExpressionAttributeValues: {
        ':text': data.text,
        ':checked': data.checked ?? false,
        ':updatedAt': new Date().toISOString(),
      },
      ConditionExpression: 'attribute_exists(userId)',
      ReturnValues: 'ALL_NEW',
    }));

    return { statusCode: 200, headers, body: JSON.stringify(result.Attributes) };
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Todo not found' }) };
    }
    throw err;
  }
};

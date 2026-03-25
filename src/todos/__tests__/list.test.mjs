import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class { constructor() {} },
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send: mockSend }) },
  QueryCommand: class { constructor(params) { Object.assign(this, params); } },
}));

const event = {
  requestContext: { authorizer: { claims: { sub: 'user-123' } } },
};

describe('list handler', () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockSend.mockReset();
    const mod = await import('../list.mjs');
    handler = mod.handler;
  });

  it('returns all todos for the user', async () => {
    const items = [{ id: '1', text: 'A' }, { id: '2', text: 'B' }];
    mockSend.mockResolvedValue({ Items: items });

    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(items);
    expect(mockSend).toHaveBeenCalledOnce();
  });

  it('returns empty array when no todos exist', async () => {
    mockSend.mockResolvedValue({ Items: [] });

    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });

  it('queries by userId', async () => {
    mockSend.mockResolvedValue({ Items: [] });
    await handler(event);

    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.KeyConditionExpression).toBe('userId = :uid');
    expect(cmd.ExpressionAttributeValues[':uid']).toBe('user-123');
  });

  it('includes CORS headers', async () => {
    mockSend.mockResolvedValue({ Items: [] });
    const res = await handler(event);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

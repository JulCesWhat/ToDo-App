import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class { constructor() {} },
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send: mockSend }) },
  DeleteCommand: class { constructor(params) { Object.assign(this, params); } },
}));

const event = {
  requestContext: { authorizer: { claims: { sub: 'user-123' } } },
  pathParameters: { id: 'todo-1' },
};

describe('delete handler', () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockSend.mockReset();
    const mod = await import('../delete.mjs');
    handler = mod.handler;
  });

  it('deletes a todo and returns 204', async () => {
    mockSend.mockResolvedValue({});

    const res = await handler(event);
    expect(res.statusCode).toBe(204);
    expect(res.body).toBeNull();
    expect(mockSend).toHaveBeenCalledOnce();
  });

  it('uses composite key with userId and id', async () => {
    mockSend.mockResolvedValue({});
    await handler(event);

    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.Key).toEqual({ userId: 'user-123', id: 'todo-1' });
  });

  it('uses ConditionExpression to verify ownership', async () => {
    mockSend.mockResolvedValue({});
    await handler(event);

    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.ConditionExpression).toBe('attribute_exists(userId)');
  });

  it('returns 404 when todo does not exist', async () => {
    const err = new Error('Condition not met');
    err.name = 'ConditionalCheckFailedException';
    mockSend.mockRejectedValue(err);

    const res = await handler(event);
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toMatch(/not found/i);
  });

  it('rethrows unexpected errors', async () => {
    mockSend.mockRejectedValue(new Error('Network fail'));

    await expect(handler(event)).rejects.toThrow('Network fail');
  });

  it('includes CORS headers', async () => {
    mockSend.mockResolvedValue({});
    const res = await handler(event);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

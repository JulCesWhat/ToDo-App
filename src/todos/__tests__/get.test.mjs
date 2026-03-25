import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class { constructor() {} },
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send: mockSend }) },
  GetCommand: class { constructor(params) { Object.assign(this, params); } },
}));

const event = {
  requestContext: { authorizer: { claims: { sub: 'user-123' } } },
  pathParameters: { id: 'todo-1' },
};

describe('get handler', () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockSend.mockReset();
    const mod = await import('../get.mjs');
    handler = mod.handler;
  });

  it('returns the todo when found', async () => {
    const item = { userId: 'user-123', id: 'todo-1', text: 'Buy milk' };
    mockSend.mockResolvedValue({ Item: item });

    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(item);
  });

  it('returns 404 when todo not found', async () => {
    mockSend.mockResolvedValue({});

    const res = await handler(event);
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toMatch(/not found/i);
  });

  it('uses composite key with userId and id', async () => {
    mockSend.mockResolvedValue({ Item: {} });
    await handler(event);

    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.Key).toEqual({ userId: 'user-123', id: 'todo-1' });
  });

  it('includes CORS headers', async () => {
    mockSend.mockResolvedValue({ Item: {} });
    const res = await handler(event);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

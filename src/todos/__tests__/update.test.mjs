import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class { constructor() {} },
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send: mockSend }) },
  UpdateCommand: class { constructor(params) { Object.assign(this, params); } },
}));

const event = (body) => ({
  requestContext: { authorizer: { claims: { sub: 'user-123' } } },
  pathParameters: { id: 'todo-1' },
  body: JSON.stringify(body),
});

describe('update handler', () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockSend.mockReset();
    const mod = await import('../update.mjs');
    handler = mod.handler;
  });

  it('updates a todo and returns 200', async () => {
    const attrs = { userId: 'user-123', id: 'todo-1', text: 'Updated', checked: true };
    mockSend.mockResolvedValue({ Attributes: attrs });

    const res = await handler(event({ text: 'Updated', checked: true }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(attrs);
  });

  it('returns 400 for invalid JSON body', async () => {
    const res = await handler({
      requestContext: { authorizer: { claims: { sub: 'user-123' } } },
      pathParameters: { id: 'todo-1' },
      body: '{bad',
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Invalid JSON/);
  });

  it('returns 400 when text is not a string', async () => {
    const res = await handler(event({ text: 42 }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/text/);
  });

  it('returns 400 when checked is not a boolean', async () => {
    const res = await handler(event({ checked: 'yes' }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/checked/);
  });

  it('returns 404 when todo does not exist', async () => {
    const err = new Error('Condition not met');
    err.name = 'ConditionalCheckFailedException';
    mockSend.mockRejectedValue(err);

    const res = await handler(event({ text: 'hi', checked: false }));
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toMatch(/not found/i);
  });

  it('rethrows unexpected errors', async () => {
    mockSend.mockRejectedValue(new Error('Network fail'));

    await expect(handler(event({ text: 'hi' }))).rejects.toThrow('Network fail');
  });

  it('includes CORS headers', async () => {
    mockSend.mockResolvedValue({ Attributes: {} });
    const res = await handler(event({ text: 'x', checked: false }));
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

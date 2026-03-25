import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class { constructor() {} },
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send: mockSend }) },
  PutCommand: class { constructor(params) { Object.assign(this, params); } },
}));

vi.mock('uuid', () => ({ v4: () => 'test-uuid-1234' }));

const event = (body) => ({
  requestContext: { authorizer: { claims: { sub: 'user-123' } } },
  body: JSON.stringify(body),
});

describe('create handler', () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
    const mod = await import('../create.mjs');
    handler = mod.handler;
  });

  it('creates a todo and returns 201', async () => {
    const res = await handler(event({ text: 'Buy milk' }));
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.text).toBe('Buy milk');
    expect(body.userId).toBe('user-123');
    expect(body.id).toBe('test-uuid-1234');
    expect(body.checked).toBe(false);
    expect(mockSend).toHaveBeenCalledOnce();
  });

  it('trims whitespace from text', async () => {
    const res = await handler(event({ text: '  Buy milk  ' }));
    const body = JSON.parse(res.body);
    expect(body.text).toBe('Buy milk');
  });

  it('returns 400 for invalid JSON body', async () => {
    const res = await handler({
      requestContext: { authorizer: { claims: { sub: 'user-123' } } },
      body: 'not json',
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Invalid JSON/);
  });

  it('returns 400 when text is missing', async () => {
    const res = await handler(event({}));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/text/);
  });

  it('returns 400 when text is not a string', async () => {
    const res = await handler(event({ text: 123 }));
    expect(res.statusCode).toBe(400);
  });

  it('includes CORS headers', async () => {
    const res = await handler(event({ text: 'test' }));
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

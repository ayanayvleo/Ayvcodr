import fetch, { Response, Headers, Request } from 'node-fetch';
if (!(globalThis as any).fetch) (globalThis as any).fetch = fetch;
if (!(globalThis as any).Response) (globalThis as any).Response = Response;
if (!(globalThis as any).Headers) (globalThis as any).Headers = Headers;
if (!(globalThis as any).Request) (globalThis as any).Request = Request;
import { TextEncoder, TextDecoder } from 'util';
// Polyfill for Node.js test environment
if (!(globalThis as any).TextEncoder) (globalThis as any).TextEncoder = TextEncoder;
if (!(globalThis as any).TextDecoder) (globalThis as any).TextDecoder = TextDecoder;
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { APIKeyManagement } from '../components/settings/api-key-management';

// Example mock API response for integration
const apiKeys = [
  {
    id: '1',
    name: 'Integration Key',
    key: 'sk-int-1234567890abcdef',
    permissions: ['read', 'write'],
    rateLimit: 1000,
    usageCount: 100,
    lastUsed: new Date('2024-01-01T10:00:00').toISOString(),
    createdAt: new Date('2024-01-01').toISOString(),
    isActive: true,
  },
];

const server = setupServer(
  rest.get('/api/api-keys', (req: any, res: any, ctx: any) => {
    return res(ctx.status(200), ctx.json(apiKeys));
  }),
  rest.post('/api/api-keys', (req: any, res: any, ctx: any) => {
    return res(ctx.status(201), ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('APIKeyManagement (integration)', () => {
  it('renders API keys from backend', async () => {
    render(<APIKeyManagement />);
    // Wait for the mock API key to appear
    await waitFor(() => expect(screen.getByText('Integration Key')).toBeInTheDocument());
  });

  // Add more integration tests as needed, e.g., for create/delete
});

# Velix TypeScript SDK


## Install

```bash
npm install @velix_sh/sdk
# or: bun add @velix_sh/sdk
```

## Quickstart

```ts
import Velix from '@velix_sh/sdk';

const client = new Velix({
  apiKey: process.env.VELIX_API_KEY,             // sk_live_…
  organizationId: process.env.VELIX_ORGANIZATION_ID, // required for most resources
});

// Tasks
const task = await client.tasks.create({ title: 'Wire up auth', priority: 'high' });
const mine = await client.tasks.list({ assigneeMe: true, priority: 'high' });
const got  = await client.tasks.retrieve('SUPER-172'); // Task | null
await client.tasks.update({ id: task.id, statusId: '<uuid>' });
await client.tasks.delete(task.id);

// Read everything else
await client.workspaces.list();
await client.projects.list();
await client.hosts.list();
await client.automations.list();

// Trigger an automation now (off-schedule)
await client.automations.run('<automation-id>');
```

Both `apiKey` and `organizationId` are picked up automatically from `VELIX_API_KEY` / `VELIX_ORGANIZATION_ID` environment variables — you can omit them in the constructor.

Find your `organizationId` via `velix organization list` in the CLI, or in the URL of any org dashboard.

## Configuration

```ts
const client = new Velix({
  apiKey: 'sk_live_…',
  organizationId: '…',
  baseURL: 'https://api.velix.sh',     // override for staging / self-hosted
  relayURL: 'https://relay.velix.sh',  // host-routed ops (workspace create, automation run)
  timeout: 60_000,
  maxRetries: 2,
  logLevel: 'warn',                       // 'off' | 'error' | 'warn' | 'info' | 'debug'
});
```

Keys starting with `sk_live_` or `sk_test_` are sent as `x-api-key`; anything else as `Authorization: Bearer <token>`.

## Errors

```ts
import { APIError, NotFoundError, RateLimitError } from '@velix_sh/sdk';

try {
  await client.tasks.create({ title: '' });
} catch (err) {
  if (err instanceof RateLimitError) { /* 429 — already retried up to maxRetries */ }
  if (err instanceof APIError)       { /* err.status, err.headers, err.error (parsed body) */ }
}
```

## Two transport paths

Most methods hit `api.velix.sh` directly. Three methods physically execute on a developer machine and route through the relay tunnel: `workspaces.create`, `workspaces.delete`, and `automations.run`. The SDK transparently exchanges your API key for a short-lived JWT to talk to the relay — no token plumbing required.

For relay-bound calls, the target host has to be online and tunneling, otherwise you'll get a `503 Host not connected`.

## License

Apache-2.0

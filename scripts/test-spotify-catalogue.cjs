// Exercise the actual Edge Function offline with Node HTTP types and fake upstreams.
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '../supabase/functions/spotify-catalogue');
const ID = 'a'.repeat(22);
function functionUnderTest({ signedIn = true, anonymous = false, retry = false } = {}) {
  let handler;
  let catalogueCalls = 0;
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url === 'http://ping-test/auth/v1/user') return Response.json({ id: 'test-user', is_anonymous: anonymous }, { status: signedIn ? 200 : 401 });
    if (url === 'https://accounts.spotify.com/api/token') return Response.json({ access_token: 'server-token', expires_in: 3600 });
    assert.ok(url.startsWith('https://api.spotify.com/v1/'));
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer server-token');
    catalogueCalls++;
    return Response.json(catalogueCalls === 1 && retry ? {} : { id: ID }, { status: catalogueCalls === 1 && retry ? 401 : 200 });
  };
  const compile = file => {
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports,
      require: name => name === './path.ts' ? compile('path.ts') : {},
      Deno: { env: { get: name => ({ SUPABASE_URL: 'http://ping-test', SUPABASE_ANON_KEY: 'public-key',
        SPOTIFY_CLIENT_ID: 'test-client', SPOTIFY_CLIENT_SECRET: 'server-secret' })[name] }, serve: h => { handler = h; } },
      fetch, Response, Request, Headers, URLSearchParams, AbortSignal, Uint8Array, TextDecoder, Date, btoa,
    });
    return module.exports;
  };
  compile('index.ts');
  return { calls, run: (body = { path: `/albums/${ID}` }, extra = {}) => handler(new Request('https://ping-test/functions/v1/spotify-catalogue', {
    method: 'POST', headers: { authorization: 'Bearer user-session', 'content-type': 'application/json', ...extra }, body: JSON.stringify(body),
  })), raw: request => handler(request) };
}
(async () => {
  let tested = 0;
  for (const options of [{ signedIn: false }, { anonymous: true }]) {
    const f = functionUnderTest(options);
    assert.equal((await f.run()).status, 401);
    assert.equal(f.calls.length, 1);
    tested++;
  }
  for (const invalid of ['https://evil.example', '/me', '/search?q=x&type=album&limit=99']) {
    const f = functionUnderTest();
    assert.equal((await f.run({ path: invalid })).status, 400);
    assert.equal(f.calls.length, 1);
    tested++;
  }
  const f = functionUnderTest();
  const response = await f.run(undefined, { origin: 'https://sonar-tracker.web.app' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://sonar-tracker.web.app');
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), { id: ID });
  assert.ok(!/server-secret|server-token|user-session/.test(text));
  assert.equal((await f.run()).status, 200);
  assert.equal(f.calls.filter(c => c.url.endsWith('/api/token')).length, 1);
  tested++;
  const r = functionUnderTest({ retry: true });
  assert.equal((await r.run()).status, 200);
  assert.equal(r.calls.filter(c => c.url.endsWith('/api/token')).length, 2);
  tested++;
  const denied = functionUnderTest();
  assert.equal((await denied.run(undefined, { origin: 'https://evil.example' })).status, 403);
  assert.equal(denied.calls.length, 0);
  assert.equal((await denied.raw(new Request('https://ping-test', { method: 'OPTIONS', headers: { origin: 'https://sonar-tracker.web.app' } }))).status, 204);
  assert.equal(denied.calls.length, 0);
  tested++;
  const big = functionUnderTest();
  assert.equal((await big.run({ path: 'x'.repeat(5000) })).status, 400);
  assert.equal(big.calls.length, 1);
  tested++;
  console.log(`Catalogue handler: ${tested} offline security/HTTP scenarios passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });

// Guards the local patch to http-cache-semantics (GHSA-ch52-4w7c-c8xp, see
// SECURITY.md "Patched dependencies"). A client `max-stale` must never serve
// a stored response whose freshness the library set to zero for a security
// reason, while an ordinary stale response stays servable.
// The package is loaded the way the docs site loads it: through Astro.
import { createRequire } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";

const docsRequire = createRequire(new URL("../packages/docs/package.json", import.meta.url));
const astroRequire = createRequire(docsRequire.resolve("astro/package.json"));
const CachePolicy = astroRequire("http-cache-semantics");

const HOUR = 3600 * 1000;
const url = "/account";
const host = "docs.example";

// Builds a policy for a response stored an hour ago in a shared cache.
function storedAnHourAgo(responseHeaders) {
  const realNow = Date.now;
  const then = realNow() - HOUR;
  Date.now = () => then;
  try {
    return new CachePolicy(
      { url, method: "GET", headers: { host } },
      { status: 200, headers: { date: new Date(then).toUTCString(), ...responseHeaders } },
      { shared: true },
    );
  } finally {
    Date.now = realNow;
  }
}

const maxStaleRequest = {
  url,
  method: "GET",
  headers: { host, "cache-control": "max-stale=999999" },
};

test("max-stale does not serve a shared response that sets a cookie", () => {
  const policy = storedAnHourAgo({
    "cache-control": "max-age=60",
    "set-cookie": "session=secret",
  });
  assert.equal(policy.satisfiesWithoutRevalidation(maxStaleRequest), false);
  if (typeof policy.evaluateRequest === "function") {
    const result = policy.evaluateRequest(maxStaleRequest);
    assert.equal(result.response, undefined);
    assert.ok(result.revalidation?.synchronous);
  }
});

test("max-stale does not serve a private response from a shared cache", () => {
  const policy = storedAnHourAgo({ "cache-control": "private, max-age=60" });
  assert.equal(policy.satisfiesWithoutRevalidation(maxStaleRequest), false);
});

test("max-stale still serves an ordinary stale response", () => {
  const policy = storedAnHourAgo({ "cache-control": "max-age=60" });
  assert.equal(policy.stale(), true);
  assert.equal(policy.satisfiesWithoutRevalidation(maxStaleRequest), true);
  if (typeof policy.evaluateRequest === "function") {
    const result = policy.evaluateRequest(maxStaleRequest);
    assert.ok(result.response);
    assert.equal(result.revalidation, undefined);
  }
});

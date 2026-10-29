// Dependency-free regression tests for the HakkaBakka service worker.
// Run from the repository root: node --test tests/sw.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");

function makeHarness(networkFetch = async () => { throw new Error("offline"); }) {
  const listeners = new Map();
  const stores = new Map();
  const origin = "https://hakkabakka.test";
  const keyOf = (request) => {
    const value = typeof request === "string" ? request : request.url;
    return value.startsWith("/") ? origin + value : value;
  };
  const cacheFor = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async addAll(urls) {
        for (const url of urls) {
          const absolute = keyOf(url);
          store.set(absolute, new Response(
            url === "/index.html" || url === "/" ? "<html>HakkaBakka</html>" : "cached",
            { headers: { "Content-Type": "text/html" } }
          ));
        }
      },
      async put(request, response) { store.set(keyOf(request), response); },
      async match(request) {
        const response = store.get(keyOf(request));
        return response ? response.clone() : undefined;
      }
    };
  };
  const caches = {
    async open(name) { return cacheFor(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async match(request) {
      for (const name of stores.keys()) {
        const response = await cacheFor(name).match(request);
        if (response) return response;
      }
      return undefined;
    }
  };
  const self = {
    clients: { async claim() {} },
    skipWaiting() {},
    addEventListener(name, callback) { listeners.set(name, callback); }
  };
  vm.runInNewContext(source, {
    self,
    caches,
    fetch: (...args) => networkFetch(...args),
    Response,
    Promise,
    URL,
    console
  });

  async function install() {
    let pending = Promise.resolve();
    listeners.get("install")({ waitUntil(value) { pending = value; } });
    await pending;
  }
  async function fetchRequest(request) {
    let responsePromise;
    listeners.get("fetch")({
      request,
      respondWith(value) { responsePromise = value; }
    });
    return responsePromise ? await responsePromise : undefined;
  }
  return { install, fetchRequest, stores, origin };
}

test("offline navigation falls back to the cached app shell", async () => {
  const h = makeHarness();
  await h.install();
  const response = await h.fetchRequest({
    method: "GET",
    mode: "navigate",
    url: h.origin + "/orders"
  });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /HakkaBakka/);
});

test("uncached offline assets return 503 text, not the app HTML", async () => {
  const h = makeHarness();
  await h.install();
  const response = await h.fetchRequest({
    method: "GET",
    mode: "cors",
    url: h.origin + "/images/not-cached.png"
  });
  assert.equal(response.status, 503);
  assert.equal(response.statusText, "Service Unavailable");
  assert.match(response.headers.get("content-type"), /text\/plain/);
  assert.match(await response.text(), /Offline and no cached response/);
});

test("non-GET requests are left untouched by the service worker", async () => {
  const h = makeHarness();
  const result = await h.fetchRequest({
    method: "POST",
    mode: "cors",
    url: h.origin + "/api/orders"
  });
  assert.equal(result, undefined);
});

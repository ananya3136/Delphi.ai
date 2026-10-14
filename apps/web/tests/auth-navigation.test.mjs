import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
import { QueryClient } from "@tanstack/react-query";

const source = await readFile(new URL("../lib/auth-navigation.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { signOut, isAuthPage } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("logout waits for server success and query cancellation before clearing and redirecting", async () => {
  const events = [];
  let completePost;
  let completeCancellation;
  const operation = signOut(
    () => new Promise((resolve) => { events.push("post"); completePost = resolve; }),
    { cancelQueries: () => new Promise((resolve) => { events.push("cancel"); completeCancellation = resolve; }), clear: () => events.push("clear") },
    (path) => events.push(path),
  );
  assert.deepEqual(events, ["post"]);
  completePost();
  await Promise.resolve();
  assert.deepEqual(events, ["post", "cancel"]);
  completeCancellation();
  await operation;
  assert.deepEqual(events, ["post", "cancel", "clear", "/logout"]);
});

test("failed logout retains the session and does not navigate", async () => {
  const failure = new Error("Server unavailable");
  await assert.rejects(signOut(
    async () => { throw failure; },
    { cancelQueries: () => assert.fail("must not cancel"), clear: () => assert.fail("must not clear") },
    () => assert.fail("must not redirect"),
  ), failure);
});

test("auth routes are separated from the public landing and private workspace", () => {
  assert.equal(isAuthPage("/login"), true);
  assert.equal(isAuthPage("/logout"), true);
  assert.equal(isAuthPage("/"), false);
  assert.equal(isAuthPage("/dashboard"), false);
});

test("late private query results cannot repopulate the cleared logout cache", async () => {
  const cache = new QueryClient();
  cache.setQueryData(["me"], { id: "private-user" });
  let completeRequest;
  const request = cache.fetchQuery({ queryKey: ["campaigns"], queryFn: () => new Promise((resolve) => { completeRequest = resolve; }) }).catch(() => undefined);
  await signOut(async () => {}, cache, (path) => assert.equal(path, "/logout"));
  completeRequest([{ id: "private-campaign" }]);
  await request;
  assert.equal(cache.getQueryCache().getAll().length, 0);
});

const componentSource = await readFile(new URL("../components/account.tsx", import.meta.url), "utf8");
const componentCode = ts.transpileModule(componentSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const require = createRequire(import.meta.url);

function renderGate(pathname, session) {
  const exports = {};
  const mocks = {
    "next/navigation": { usePathname: () => pathname, useRouter: () => ({ replace() {} }) },
    "@tanstack/react-query": { useQueryClient: () => ({}), useQuery: () => ({ isPending: false, data: session }) },
    "@/lib/api": { api() {} },
    "@/lib/auth-navigation": { isAuthPage, signOut },
    "./ui": { Loading: () => React.createElement("p", null, "Loading"), ErrorNotice: () => null },
  };
  new Function("require", "exports", componentCode)((name) => mocks[name] ?? require(name), exports);
  return renderToStaticMarkup(React.createElement(exports.AccountGate, null, React.createElement("p", null, "PRIVATE WORKSPACE")));
}

test("signed-out logout renders login without workspace children", () => {
  const html = renderGate("/logout", undefined);
  assert.match(html, /You are signed out/);
  assert.match(html, /Sign in to Delph.ai/);
  assert.doesNotMatch(html, /PRIVATE WORKSPACE/);
});

test("demo logout requires explicit demo entry and does not claim real signout", () => {
  const html = renderGate("/logout", { demo: true });
  assert.match(html, /Open local demo/);
  assert.match(html, /does not provide production authentication/);
  assert.doesNotMatch(html, /PRIVATE WORKSPACE|You are signed out/);
});

test("active real session on either auth page waits for redirect without false signout", () => {
  for (const pathname of ["/login", "/logout"]) {
    const html = renderGate(pathname, { demo: false, id: "user" });
    assert.match(html, /Loading/);
    assert.doesNotMatch(html, /PRIVATE WORKSPACE|You are signed out|<form/);
  }
});

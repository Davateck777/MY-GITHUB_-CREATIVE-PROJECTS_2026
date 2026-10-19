/** Backup tests cover round-trips and malformed / hostile structures. */
import test from "node:test";
import assert from "node:assert/strict";
import { makeBackup, parseBackup, draftText } from "../js/exportImport.js";
const d = {
  id: "test-id",
  name: "Test",
  headline: "Brand consultant",
  about: "Hello",
  role: "Consultant",
  audience: "Founders",
  keywords: "brand",
  updatedAt: "2026-10-14T12:00:00.000Z",
};
test("backup round-trips", () =>
  assert.deepEqual(parseBackup(makeBackup([d])), [d]));
test("rejects invalid JSON", () =>
  assert.throws(() => parseBackup("{"), /valid JSON/));
test("rejects unsupported versions", () =>
  assert.throws(() => parseBackup('{"version":2,"drafts":[]}'), /version 1/));
test("rejects invalid field types", () =>
  assert.throws(() => parseBackup(makeBackup([{ ...d, about: 22 }])), /about/));
test("rejects duplicate IDs", () =>
  assert.throws(() => parseBackup(makeBackup([d, d])), /duplicate/));
test("rejects invalid dates", () =>
  assert.throws(
    () => parseBackup(makeBackup([{ ...d, updatedAt: "oops" }])),
    /date/,
  ));
test("ignores unexpected properties", () =>
  assert.deepEqual(parseBackup(makeBackup([{ ...d, unexpected: "ignored" }])), [
    d,
  ]));
test("rejects oversized file", () =>
  assert.throws(() => parseBackup(" ".repeat(5_000_001)), /5 MB/));
test("text export includes both fields", () =>
  assert.ok(
    draftText(d).includes("HEADLINE\nBrand consultant\n\nABOUT\nHello"),
  ));

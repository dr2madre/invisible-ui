// The run sheet's rules, on a fixture tree rather than on the repository. Most
// of them say the same thing: a generated sheet carries no answer.
//
//   node --test scripts/

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  CHECKS,
  COLUMNS,
  ENVIRONMENT,
  OPEN_SCENARIOS,
  emptyField,
  pages,
  sheet,
} from "./generate-a11y-lab.mjs";

const tree = (files) => {
  const root = mkdtempSync(join(tmpdir(), "a11y-lab-"));
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, text);
  }
  return root;
};

const page = (title) => `---\ntitle: "${title}"\n---\n\nbody\n`;
const one = [{ slug: "forms/button", title: "Button", url: "http://x/forms/button/" }];

/** The rows of a markdown table, header and rule dropped. */
const bodyRows = (text) =>
  text
    .split("\n")
    .filter(
      (line) => line.startsWith("| ") && !line.includes("---") && !line.startsWith("| Check"),
    );

test("every component page reaches the sheet, nested ones included", () => {
  const root = tree({
    "forms/combobox.mdx": page("Combobox"),
    "feedback/dialog/confirm-dialog.mdx": page("Confirm Dialog"),
    "navigation/tabs.mdx": page("Tabs"),
  });
  try {
    assert.deepEqual(
      pages(root).map((entry) => entry.title),
      ["Combobox", "Confirm Dialog", "Tabs"],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("controls and overlays come before prose, and ties break by slug", () => {
  const root = tree({
    "formatting-display/kbd.mdx": page("Kbd"),
    "navigation/tabs.mdx": page("Tabs"),
    "forms/switch.mdx": page("Switch"),
    "forms/button.mdx": page("Button"),
    "feedback/dialog/index.mdx": page("Dialog"),
  });
  try {
    assert.deepEqual(
      pages(root).map((entry) => entry.slug),
      [
        "forms/button",
        "forms/switch",
        "feedback/dialog/index",
        "navigation/tabs",
        "formatting-display/kbd",
      ],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a folder's index page is served as the folder", () => {
  const root = tree({ "feedback/dialog/index.mdx": page("Dialog") });
  try {
    assert.equal(pages(root)[0].url.endsWith("/components/feedback/dialog/"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the section index and the naming guidance are not components", () => {
  const root = tree({
    "index.mdx": page("Components"),
    "naming.mdx": page("Naming"),
    "forms/button.mdx": page("Button"),
  });
  try {
    assert.deepEqual(
      pages(root).map((entry) => entry.slug),
      ["forms/button"],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a page without a title still reaches the sheet, under its slug", () => {
  const root = tree({ "forms/odd.mdx": "no frontmatter here\n" });
  try {
    assert.deepEqual(
      pages(root).map((entry) => entry.title),
      ["forms/odd"],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the sheet asks the six checks by name, and the audit's open scenarios", () => {
  const text = sheet(one);
  // Named literally: comparing the sheet to the same constant it was built
  // from would pass with a check deleted.
  for (const title of [
    "Screen reader",
    "Touch",
    "Zoom to 400%",
    "Forced colours",
    "Text expansion",
    "Keyboard only",
  ]) {
    assert.ok(text.includes(`| ${title} |`), `the sheet does not ask about ${title}`);
  }
  assert.equal(CHECKS.length, 6);
  assert.ok(text.includes("| Link and Button keyboard semantics |"));
  assert.ok(text.includes("| built-package import in a clean consumer |"));
  assert.equal(OPEN_SCENARIOS.length, 8);
});

test("every table has a place to write and a place to judge, and both are empty", () => {
  const text = sheet(one);
  assert.ok(text.includes("| Check | What was seen | Verdict |"), "a column went missing");
  assert.deepEqual(COLUMNS, ["Check", "What was seen", "Verdict"]);
  const rows = bodyRows(text);
  assert.equal(rows.length, CHECKS.length + OPEN_SCENARIOS.length);
  for (const row of rows) {
    const cells = row.split("|").map((cell) => cell.trim());
    assert.equal(cells.length, 5, `a row has the wrong number of cells: ${row}`);
    assert.equal(cells[2], "", `a generated sheet wrote an observation: ${row}`);
    assert.equal(cells[3], "", `a generated sheet wrote a verdict: ${row}`);
  }
});

test("no verdict word survives, in a fixture sheet or in the real one", () => {
  // The words a reader would take as an answer.
  const words = [
    "pass",
    "fail",
    "ok",
    "n/a",
    "not applicable",
    "verified",
    "yes",
    "no issues",
    "none",
    "good",
    "works",
    "fine",
    "compliant",
    "accessible",
    "conformant",
    "tbd",
  ];
  const root = tree({ "forms/button.mdx": page("Button"), "forms/pass.mdx": page("Pass phrase") });
  try {
    for (const text of [sheet(one), sheet(pages(root)), sheet(pages())]) {
      const cells = bodyRows(text).flatMap((row) => row.split("|").slice(2, 4));
      for (const cell of cells) {
        for (const word of words) {
          assert.equal(
            new RegExp(`\\b${word}\\b`, "i").test(cell),
            false,
            `a result cell contains the word "${word}"`,
          );
        }
      }
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  assert.equal(emptyField(), "");
});

test("the environment is asked for, empty, before anything else", () => {
  const text = sheet(one);
  for (const field of ENVIRONMENT) {
    assert.ok(text.includes(`- ${field}: \n`), `${field} is not asked for, or is answered for you`);
    assert.ok(
      text.indexOf(`- ${field}: `) < text.indexOf("### Button"),
      `${field} is asked for after the pages`,
    );
  }
});

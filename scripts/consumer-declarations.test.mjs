import { test } from "node:test";
import assert from "node:assert/strict";
import { ourDeclarationErrors } from "./consumer-declarations.mjs";

// Real tsc output, from the run that prompted this module. The dependency
// lines are a Svelte dependency shipping declarations that `nodenext`
// resolution refuses; the consumer compiles against them only because the
// check turns `skipLibCheck` off to read our own.
const DEPENDENCY = [
  "node_modules/esrap/types/public.d.ts(1,45): error TS2834: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Consider adding an extension to the import path.",
  "node_modules/esrap/types/languages/ts/public.d.ts(2,54): error TS2834: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Consider adding an extension to the import path.",
].join("\n");

const OURS =
  "node_modules/@design-system/core/dist/index.d.ts(4170,30): error TS2304: Cannot find name 'NotAType'.";

const CONSUMER = 'types.ts(3,24): error TS2307: Cannot find module "@design-system/react".';

test("a dependency's broken declarations are not ours to answer for", () => {
  assert.deepEqual(ourDeclarationErrors(DEPENDENCY), []);
});

test("a declaration this repository ships is", () => {
  assert.deepEqual(ourDeclarationErrors([DEPENDENCY, OURS].join("\n")), [OURS]);
});

test("so is the consumer file that imports every advertised entry point", () => {
  assert.deepEqual(ourDeclarationErrors([DEPENDENCY, CONSUMER].join("\n")), [CONSUMER]);
});

test("the lines keep the order the compiler printed them in", () => {
  assert.deepEqual(ourDeclarationErrors([OURS, DEPENDENCY, CONSUMER].join("\n")), [OURS, CONSUMER]);
});

test("no output at all is no error", () => {
  assert.deepEqual(ourDeclarationErrors(""), []);
});

test("a package whose name only starts like ours is a dependency", () => {
  const other =
    "node_modules/@design-systems/other/index.d.ts(1,1): error TS2304: Cannot find name 'X'.";
  assert.deepEqual(ourDeclarationErrors(other), []);
});

test("an error object's message, not its stdout, still reads", () => {
  assert.deepEqual(ourDeclarationErrors(Buffer.from(OURS)), [OURS]);
});

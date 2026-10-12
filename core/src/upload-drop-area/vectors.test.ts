import { describe, expect, it } from "vitest";
import { acceptsFile, splitFiles } from "./accept";
import vectors from "./__vectors__/upload-drop-area.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("upload drop area vectors", () => {
  for (const v of vectors.accepts) {
    it(`accepts: ${v.name}`, () => {
      expect(acceptsFile(v.file, v.accept)).toBe(v.expect);
    });
  }
  for (const v of vectors.split) {
    it(`split: ${v.name}`, () => {
      const { accepted, rejected } = splitFiles(v.files, {
        accept: v.accept,
        multiple: v.multiple,
      });
      expect({
        accepted: accepted.map((file) => file.name),
        rejected: rejected.map(({ file, reason }) => ({ name: file.name, reason })),
      }).toEqual(v.expect);
    });
  }

  it("keeps the files it is given, so an adapter gets its own File objects back", () => {
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    expect(splitFiles([file]).accepted[0]).toBe(file);
  });
});

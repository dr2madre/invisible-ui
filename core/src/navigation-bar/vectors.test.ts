import { describe, expect, it } from "vitest";
import type { Messages } from "../i18n/messages";
import { move } from "./connect";
import { badgeAnnouncements, describeDestination } from "./text";
import type { NavigationTarget } from "./types";
import badges from "./__vectors__/badges.json";
import describeVectors from "./__vectors__/describe.json";
import keys from "./__vectors__/keys.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// files, so both implementations answer the same cases.

describe("navigation bar key vectors", () => {
  const values = keys.destinations.map((destination) => destination.value);
  for (const vector of keys.keys) {
    it(vector.name, () => {
      const next = move({
        key: vector.key,
        index: values.indexOf(vector.from),
        count: values.length,
        direction: vector.direction as "ltr" | "rtl" | undefined,
      });
      expect(next === null ? null : values[next]).toBe(vector.focus);
    });
  }
});

interface DescribeVector {
  name: string;
  destination: NavigationTarget;
  index?: number;
  count?: number;
  current?: boolean;
  messages?: Messages;
  expect: string;
}

describe("navigation bar describe vectors", () => {
  for (const vector of describeVectors.cases as DescribeVector[]) {
    it(vector.name, () => {
      const { destination, expect: expected, name: _name, ...options } = vector;
      expect(describeDestination(destination, options)).toBe(expected);
    });
  }
});

interface BadgeVector {
  name: string;
  previous: NavigationTarget[] | null;
  next: NavigationTarget[];
  expect: { value: string; text: string }[];
}

describe("navigation bar badge vectors", () => {
  for (const vector of badges.cases as BadgeVector[]) {
    it(vector.name, () => {
      expect(badgeAnnouncements(vector.previous, vector.next)).toEqual(vector.expect);
    });
  }
});

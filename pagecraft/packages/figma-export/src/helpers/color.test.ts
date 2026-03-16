import { describe, expect, it } from "vitest";

import { hexToRgba, parseColorString, rgbaToHex } from "./color";

describe("color helpers", () => {
  it("parses hex colors including alpha", () => {
    expect(hexToRgba("#3366FF")).toEqual({
      r: 0.2,
      g: 0.4,
      b: 1,
      a: 1
    });

    expect(hexToRgba("#3366FF80")).toEqual({
      r: 0.2,
      g: 0.4,
      b: 1,
      a: 0.5019607843137255
    });
  });

  it("parses rgb and rgba strings", () => {
    expect(parseColorString("rgb(51, 102, 255)")).toEqual({
      r: 0.2,
      g: 0.4,
      b: 1,
      a: 1
    });

    expect(parseColorString("rgba(51, 102, 255, 0.5)")).toEqual({
      r: 0.2,
      g: 0.4,
      b: 1,
      a: 0.5
    });
  });

  it("formats rgba into uppercase hex", () => {
    expect(
      rgbaToHex({
        r: 0.2,
        g: 0.4,
        b: 1,
        a: 1
      })
    ).toBe("#3366FF");
  });
});

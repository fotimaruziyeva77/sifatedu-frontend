import { describe, expect, it } from "vitest";

import { checkFiles, extensionOf, MAX_FILES } from "./limits";

function file(name: string, size = 10): File {
  return new File([new Uint8Array(size)], name);
}

describe("checkFiles", () => {
  it("ruxsat etilgan fayllar", () => {
    expect(checkFiles([file("rasm.PNG"), file("loyiha.zip"), file("main.py")])).toEqual({
      problem: null,
    });
  });

  it("dastur fayli rad etiladi", () => {
    expect(checkFiles([file("setup.exe")])).toEqual({ problem: "type", name: "setup.exe" });
  });

  it("soni va hajmi", () => {
    const many = Array.from({ length: MAX_FILES + 1 }, (_, index) => file(`r${index}.png`));
    expect(checkFiles(many).problem).toBe("count");
    expect(checkFiles([file("katta.zip", 21 * 1024 * 1024)]).problem).toBe("size");
    const big = Array.from({ length: 3 }, (_, index) => file(`${index}.zip`, 19 * 1024 * 1024));
    expect(checkFiles(big).problem).toBe("total");
  });

  it("kengaytma kichik harfda", () => {
    expect(extensionOf("Sahifa.HTML")).toBe(".html");
    expect(extensionOf("README")).toBe("");
  });
});

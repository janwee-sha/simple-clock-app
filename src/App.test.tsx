import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

const FIXED_TIME = new Date(2026, 6, 22, 15, 4, 5, 500);

function rotationOf(container: HTMLElement, selector: string) {
  const transform = container.querySelector<HTMLElement>(selector)?.style.transform;
  const angle = transform?.match(/rotate\(([-\d.]+)deg\)/)?.[1];

  if (angle === undefined) {
    throw new Error(`未找到 ${selector} 的旋转角度`);
  }

  return Number(angle);
}

describe("App", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TIME);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it("renders a complete clock face", () => {
    expect(container.querySelector("h1")?.textContent).toBe("此刻");
    expect(container.querySelectorAll(".tick")).toHaveLength(60);
    expect(container.querySelectorAll(".tick-hour")).toHaveLength(12);
    expect(
      Array.from(container.querySelectorAll(".hour-number"), (number) => number.textContent),
    ).toEqual(Array.from({ length: 12 }, (_, index) => String(index + 1)));
  });

  it("shows the local date and positions every hand for the current time", () => {
    const digitalTime = container.querySelector("time");
    const clockFace = container.querySelector(".clock-face");

    expect(digitalTime?.textContent).toBe("15:04:05");
    expect(digitalTime?.getAttribute("datetime")).toBe(FIXED_TIME.toISOString());
    expect(container.querySelector(".date-line")?.textContent).toBe("2026年7月22日星期三");
    expect(clockFace?.getAttribute("aria-label")).toBe(
      "当前本地时间：15:04:05，2026年7月22日星期三",
    );

    expect(rotationOf(container, ".hour-hand")).toBeCloseTo(2.0458, 4);
    expect(rotationOf(container, ".minute-hand")).toBeCloseTo(-65.45, 4);
    expect(rotationOf(container, ".second-hand")).toBeCloseTo(-57, 4);
  });

  it("refreshes the displayed time on its timer", async () => {
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });

    expect(container.querySelector("time")?.textContent).toBe("15:04:06");
    expect(rotationOf(container, ".second-hand")).toBeCloseTo(-51, 4);
  });
});

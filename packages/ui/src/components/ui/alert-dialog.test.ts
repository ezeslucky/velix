import { describe, expect, test } from "bun:test";

import { alertDialogContentClassName } from "./alert-dialog";

describe("alertDialogContentClassName", () => {
	test("caps height to the viewport so footers stay reachable", () => {
		expect(alertDialogContentClassName).toMatch(/\bmax-h-\[/);
	});

	test("scrolls overflowing content instead of clipping it", () => {
		expect(alertDialogContentClassName).toMatch(/\boverflow-y-(auto|scroll)\b/);
	});
});

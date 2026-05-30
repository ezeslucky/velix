import { describe, expect, it } from "bun:test";
import { getWebSearchViewModel } from "./getWebSearchViewModel";

describe("getWebSearchViewModel", () => {
	it("maps structured results array", () => {
		const viewModel = getWebSearchViewModel({
			args: { query: "velix" },
			result: {
				results: [
					{
						title: "Velix - Run 10+ parallel coding agents on your machine",
						url: "https://velix.sh/",
						content: "snippet",
					},
				],
			},
		});

		expect(viewModel.query).toBe("velix");
		expect(viewModel.results).toEqual([
			{
				title: "Velix - Run 10+ parallel coding agents on your machine",
				url: "https://velix.sh/",
			},
		]);
	});

	it("parses transcript-style text with headings and urls", () => {
		const viewModel = getWebSearchViewModel({
			args: { query: "velix.sh terminal for coding agents" },
			result: {
				text: `Answer: summary

## velix/README.md at main - GitHub
https://github.com/ezeslucky/velix/blob/main/README.md
Description text

## Velix - Run 10+ parallel coding agents on your machine
https://velix.sh/`,
			},
		});

		expect(viewModel.results).toEqual([
			{
				title: "velix/README.md at main - GitHub",
				url: "https://github.com/ezeslucky/velix/blob/main/README.md",
			},
			{
				title: "Velix - Run 10+ parallel coding agents on your machine",
				url: "https://velix.sh/",
			},
		]);
	});

	it("reads nested text payloads and deduplicates urls", () => {
		const viewModel = getWebSearchViewModel({
			args: { query: "velix" },
			result: {
				result: {
					output: {
						text: `## Velix
https://velix.sh/
https://velix.sh/`,
					},
				},
			},
		});

		expect(viewModel.results).toEqual([
			{
				title: "Velix",
				url: "https://velix.sh/",
			},
		]);
	});
});

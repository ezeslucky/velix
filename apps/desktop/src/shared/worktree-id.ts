
export function normalizeWorkspaceName(name?: string): string | undefined {
	if (!name || name === "velix") return undefined;
	return name
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "-")
		.slice(0, 32);
}


export function deriveWorkspaceNameFromWorktreeSegments(
	segments: string[],
): string | undefined {
	if (segments.length < 2) return undefined;

	const appsIndex = segments.lastIndexOf("apps");
	if (appsIndex === 1 && segments[appsIndex + 1] === "desktop") {
		return undefined;
	}

	const endIndex =
		appsIndex > 1 && segments[appsIndex + 1] === "desktop"
			? appsIndex
			: segments.length;

	const workspaceSegments = segments.slice(1, endIndex);
	if (workspaceSegments.length === 0) return undefined;

	return normalizeWorkspaceName(workspaceSegments.join("-"));
}

export function getWorkspaceName(): string | undefined {
	return normalizeWorkspaceName(process.env.VELIX_WORKSPACE_NAME);
}

import { PencilLineIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { VelixToolCall } from "../VelixToolCall";

interface UpdateWorkspaceToolCallProps {
	part: ToolPart;
}

export function UpdateWorkspaceToolCall({
	part,
}: UpdateWorkspaceToolCallProps) {
	return (
		<VelixToolCall
			part={part}
			toolName="Update workspace"
			icon={PencilLineIcon}
		/>
	);
}

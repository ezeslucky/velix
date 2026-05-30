import { Trash2Icon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { VelixToolCall } from "../VelixToolCall";

interface DeleteWorkspaceToolCallProps {
	part: ToolPart;
}

export function DeleteWorkspaceToolCall({
	part,
}: DeleteWorkspaceToolCallProps) {
	return (
		<VelixToolCall
			part={part}
			toolName="Delete workspace"
			icon={Trash2Icon}
		/>
	);
}

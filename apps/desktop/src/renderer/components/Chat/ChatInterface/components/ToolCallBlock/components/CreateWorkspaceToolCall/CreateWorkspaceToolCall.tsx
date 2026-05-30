import { FolderPlusIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { VelixToolCall } from "../VelixToolCall";

interface CreateWorkspaceToolCallProps {
	part: ToolPart;
}

export function CreateWorkspaceToolCall({
	part,
}: CreateWorkspaceToolCallProps) {
	return (
		<VelixToolCall
			part={part}
			toolName="Create workspace"
			icon={FolderPlusIcon}
		/>
	);
}

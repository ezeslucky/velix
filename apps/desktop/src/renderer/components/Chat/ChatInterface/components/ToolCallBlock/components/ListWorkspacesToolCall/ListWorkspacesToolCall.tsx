import { FolderTreeIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { VelixToolCall } from "../VelixToolCall";

interface ListWorkspacesToolCallProps {
	part: ToolPart;
}

export function ListWorkspacesToolCall({ part }: ListWorkspacesToolCallProps) {
	return (
		<VelixToolCall
			part={part}
			toolName="List workspaces"
			icon={FolderTreeIcon}
		/>
	);
}

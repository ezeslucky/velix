import { FolderKanbanIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { VelixToolCall } from "../VelixToolCall";

interface ListProjectsToolCallProps {
	part: ToolPart;
}

export function ListProjectsToolCall({ part }: ListProjectsToolCallProps) {
	return (
		<VelixToolCall
			part={part}
			toolName="List projects"
			icon={FolderKanbanIcon}
		/>
	);
}

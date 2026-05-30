import { InfoIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { VelixToolCall } from "../VelixToolCall";

interface GetWorkspaceDetailsToolCallProps {
	part: ToolPart;
}

export function GetWorkspaceDetailsToolCall({
	part,
}: GetWorkspaceDetailsToolCallProps) {
	return (
		<VelixToolCall
			part={part}
			toolName="Get workspace details"
			icon={InfoIcon}
		/>
	);
}

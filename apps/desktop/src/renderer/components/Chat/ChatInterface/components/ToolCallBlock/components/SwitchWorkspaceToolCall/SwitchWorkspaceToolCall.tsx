import { ArrowRightLeftIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { VelixToolCall } from "../VelixToolCall";

interface SwitchWorkspaceToolCallProps {
	part: ToolPart;
}

export function SwitchWorkspaceToolCall({
	part,
}: SwitchWorkspaceToolCallProps) {
	return (
		<VelixToolCall
			part={part}
			toolName="Switch workspace"
			icon={ArrowRightLeftIcon}
		/>
	);
}

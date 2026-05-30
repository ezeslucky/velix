import { AppWindowIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { VelixToolCall } from "../VelixToolCall";

interface GetAppContextToolCallProps {
	part: ToolPart;
}

export function GetAppContextToolCall({ part }: GetAppContextToolCallProps) {
	return (
		<VelixToolCall
			part={part}
			toolName="Get app context"
			icon={AppWindowIcon}
		/>
	);
}

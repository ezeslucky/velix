import { MonitorSmartphoneIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { VelixToolCall } from "../VelixToolCall";

interface ListDevicesToolCallProps {
	part: ToolPart;
}

export function ListDevicesToolCall({ part }: ListDevicesToolCallProps) {
	return (
		<VelixToolCall
			part={part}
			toolName="List devices"
			icon={MonitorSmartphoneIcon}
		/>
	);
}

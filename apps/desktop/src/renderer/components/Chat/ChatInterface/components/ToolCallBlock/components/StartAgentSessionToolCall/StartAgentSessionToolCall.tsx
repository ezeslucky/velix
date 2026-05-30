import { BotIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { VelixToolCall } from "../VelixToolCall";

interface StartAgentSessionToolCallProps {
	part: ToolPart;
	toolName?: string;
}

export function StartAgentSessionToolCall({
	part,
	toolName = "Start agent session",
}: StartAgentSessionToolCallProps) {
	return <VelixToolCall part={part} toolName={toolName} icon={BotIcon} />;
}

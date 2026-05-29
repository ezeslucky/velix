import { Message, MessageContent } from "@velix/ui/ai-elements/message";
import { ShimmerLabel } from "@velix/ui/ai-elements/shimmer-label";

export function ThinkingMessage() {
	return (
		<Message from="assistant">
			<MessageContent>
				<ShimmerLabel className="text-sm text-muted-foreground">
					Thinking...
				</ShimmerLabel>
			</MessageContent>
		</Message>
	);
}

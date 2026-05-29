import { usePromptInputController } from "@velix/ui/ai-elements/prompt-input";
import { useEffect } from "react";

export function useFocusPromptOnPane(isFocused: boolean) {
	const { textInput } = usePromptInputController();
	const { focus } = textInput;

	useEffect(() => {
		if (isFocused) {
			focus();
		}
	}, [isFocused, focus]);
}

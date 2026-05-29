import type { SelectInvitation } from "@velix/db/schema";
import { Button } from "@velix/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@velix/ui/dropdown-menu";
import { toast } from "@velix/ui/sonner";
import { useState } from "react";
import { HiEllipsisVertical, HiOutlineXMark } from "react-icons/hi2";
import { authClient } from "renderer/lib/auth-client";

interface InvitationActionsProps {
	invitation: SelectInvitation;
}

export function InvitationActions({ invitation }: InvitationActionsProps) {
	const [isCanceling, setIsCanceling] = useState(false);

	const handleCancel = async () => {
		setIsCanceling(true);
		try {
			await authClient.organization.cancelInvitation({
				invitationId: invitation.id,
			});
			toast.success("Invitation canceled");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to cancel invitation",
			);
		} finally {
			setIsCanceling(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<HiEllipsisVertical className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onSelect={handleCancel}
					disabled={isCanceling}
					className="text-destructive gap-2"
				>
					<HiOutlineXMark className="h-4 w-4" />
					Cancel
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

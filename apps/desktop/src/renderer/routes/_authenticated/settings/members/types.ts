import type {
	SelectInvitation,
	SelectMember,
	SelectUser,
} from "@velix/db/schema/auth";
import type { OrganizationRole } from "@velix/shared/auth";

export type TeamMember = SelectUser &
	SelectMember & {
		memberId: string;
		role: OrganizationRole;
	};

export type InvitationRow = SelectInvitation & {
	inviterName: string;
};

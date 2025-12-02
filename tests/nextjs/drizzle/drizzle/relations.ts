import { relations } from "drizzle-orm/relations";
import { organization, team, user, session, member, account, invitation, teamMember } from "./schema";

export const teamRelations = relations(team, ({one, many}) => ({
	organization: one(organization, {
		fields: [team.organizationId],
		references: [organization.id]
	}),
	teamMembers: many(teamMember),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	teams: many(team),
	members: many(member),
	invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	members: many(member),
	accounts: many(account),
	invitations: many(invitation),
	teamMembers: many(teamMember),
}));

export const memberRelations = relations(member, ({one}) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
}));

export const teamMemberRelations = relations(teamMember, ({one}) => ({
	team: one(team, {
		fields: [teamMember.teamId],
		references: [team.id]
	}),
	user: one(user, {
		fields: [teamMember.userId],
		references: [user.id]
	}),
}));
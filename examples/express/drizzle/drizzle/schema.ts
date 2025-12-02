import { pgTable, unique, text, timestamp, boolean, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const organization = pgTable("organization", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text(),
	logo: text(),
	metadata: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("organization_slug_unique").on(table.slug),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	image: text(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const team = pgTable("team", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	organizationId: text("organization_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "team_organization_id_organization_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	activeOrganizationId: text("active_organization_id"),
	activeTeamId: text("active_team_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const member = pgTable("member", {
	id: text().primaryKey().notNull(),
	role: text().default('member').notNull(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "member_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "member_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	scope: text(),
	password: text(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const invitation = pgTable("invitation", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	role: text(),
	status: text().default('pending').notNull(),
	organizationId: text("organization_id").notNull(),
	teamId: text("team_id"),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	inviterId: text("inviter_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "invitation_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.inviterId],
			foreignColumns: [user.id],
			name: "invitation_inviter_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const teamMember = pgTable("team_member", {
	id: text().primaryKey().notNull(),
	teamId: text("team_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "team_member_team_id_team_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "team_member_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

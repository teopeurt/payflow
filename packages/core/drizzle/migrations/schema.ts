import { pgTable, pgSchema, index, uuid, text, timestamp, foreignKey, check, jsonb, bigserial, varchar, boolean, uniqueIndex, smallint, inet, json, pgPolicy, integer, unique, date, numeric, bigint, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const auth = pgSchema("auth");
export const finance = pgSchema("finance");
export const messaging = pgSchema("messaging");
export const app = pgSchema("app");
export const audit = pgSchema("audit");
export const aalLevelInAuth = auth.enum("aal_level", ['aal1', 'aal2', 'aal3'])
export const codeChallengeMethodInAuth = auth.enum("code_challenge_method", ['s256', 'plain'])
export const factorStatusInAuth = auth.enum("factor_status", ['unverified', 'verified'])
export const factorTypeInAuth = auth.enum("factor_type", ['totp', 'webauthn', 'phone'])
export const oneTimeTokenTypeInAuth = auth.enum("one_time_token_type", ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])
export const appRole = pgEnum("app_role", ['admin', 'client', 'team_member'])
export const recurringFrequencyType = pgEnum("recurring_frequency_type", ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
export const recurringUntilType = pgEnum("recurring_until_type", ['indefinitely', 'on_date', 'count'])


export const flowStateInAuth = auth.table("flow_state", {
	id: uuid().notNull(),
	userId: uuid("user_id"),
	authCode: text("auth_code").notNull(),
	codeChallengeMethod: codeChallengeMethodInAuth("code_challenge_method").notNull(),
	codeChallenge: text("code_challenge").notNull(),
	providerType: text("provider_type").notNull(),
	providerAccessToken: text("provider_access_token"),
	providerRefreshToken: text("provider_refresh_token"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	authenticationMethod: text("authentication_method").notNull(),
	authCodeIssuedAt: timestamp("auth_code_issued_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("flow_state_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_auth_code").using("btree", table.authCode.asc().nullsLast().op("text_ops")),
	index("idx_user_id_auth_method").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.authenticationMethod.asc().nullsLast().op("uuid_ops")),
]);

export const samlProvidersInAuth = auth.table("saml_providers", {
	id: uuid().notNull(),
	ssoProviderId: uuid("sso_provider_id").notNull(),
	entityId: text("entity_id").notNull(),
	metadataXml: text("metadata_xml").notNull(),
	metadataUrl: text("metadata_url"),
	attributeMapping: jsonb("attribute_mapping"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	nameIdFormat: text("name_id_format"),
}, (table) => [
	index("saml_providers_sso_provider_id_idx").using("btree", table.ssoProviderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ssoProviderId],
			foreignColumns: [ssoProvidersInAuth.id],
			name: "saml_providers_sso_provider_id_fkey"
		}).onDelete("cascade"),
	check("entity_id not empty", sql`char_length(entity_id) > 0`),
	check("metadata_url not empty", sql`(metadata_url = NULL::text) OR (char_length(metadata_url) > 0)`),
	check("metadata_xml not empty", sql`char_length(metadata_xml) > 0`),
]);

export const instancesInAuth = auth.table("instances", {
	id: uuid().notNull(),
	uuid: uuid(),
	rawBaseConfig: text("raw_base_config"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
});

export const samlRelayStatesInAuth = auth.table("saml_relay_states", {
	id: uuid().notNull(),
	ssoProviderId: uuid("sso_provider_id").notNull(),
	requestId: text("request_id").notNull(),
	forEmail: text("for_email"),
	redirectTo: text("redirect_to"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	flowStateId: uuid("flow_state_id"),
}, (table) => [
	index("saml_relay_states_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("saml_relay_states_for_email_idx").using("btree", table.forEmail.asc().nullsLast().op("text_ops")),
	index("saml_relay_states_sso_provider_id_idx").using("btree", table.ssoProviderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.flowStateId],
			foreignColumns: [flowStateInAuth.id],
			name: "saml_relay_states_flow_state_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ssoProviderId],
			foreignColumns: [ssoProvidersInAuth.id],
			name: "saml_relay_states_sso_provider_id_fkey"
		}).onDelete("cascade"),
	check("request_id not empty", sql`char_length(request_id) > 0`),
]);

export const refreshTokensInAuth = auth.table("refresh_tokens", {
	instanceId: uuid("instance_id"),
	id: bigserial({ mode: "bigint" }).notNull(),
	token: varchar({ length: 255 }),
	userId: varchar("user_id", { length: 255 }),
	revoked: boolean(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	parent: varchar({ length: 255 }),
	sessionId: uuid("session_id"),
}, (table) => [
	index("refresh_tokens_instance_id_idx").using("btree", table.instanceId.asc().nullsLast().op("uuid_ops")),
	index("refresh_tokens_instance_id_user_id_idx").using("btree", table.instanceId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	index("refresh_tokens_parent_idx").using("btree", table.parent.asc().nullsLast().op("text_ops")),
	index("refresh_tokens_session_id_revoked_idx").using("btree", table.sessionId.asc().nullsLast().op("bool_ops"), table.revoked.asc().nullsLast().op("bool_ops")),
	index("refresh_tokens_updated_at_idx").using("btree", table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessionsInAuth.id],
			name: "refresh_tokens_session_id_fkey"
		}).onDelete("cascade"),
]);

export const ssoDomainsInAuth = auth.table("sso_domains", {
	id: uuid().notNull(),
	ssoProviderId: uuid("sso_provider_id").notNull(),
	domain: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("sso_domains_domain_idx").using("btree", sql`lower(domain)`),
	index("sso_domains_sso_provider_id_idx").using("btree", table.ssoProviderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ssoProviderId],
			foreignColumns: [ssoProvidersInAuth.id],
			name: "sso_domains_sso_provider_id_fkey"
		}).onDelete("cascade"),
	check("domain not empty", sql`char_length(domain) > 0`),
]);

export const usersInAuth = auth.table("users", {
	instanceId: uuid("instance_id"),
	id: uuid().notNull(),
	aud: varchar({ length: 255 }),
	role: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	encryptedPassword: varchar("encrypted_password", { length: 255 }),
	emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true, mode: 'string' }),
	invitedAt: timestamp("invited_at", { withTimezone: true, mode: 'string' }),
	confirmationToken: varchar("confirmation_token", { length: 255 }),
	confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true, mode: 'string' }),
	recoveryToken: varchar("recovery_token", { length: 255 }),
	recoverySentAt: timestamp("recovery_sent_at", { withTimezone: true, mode: 'string' }),
	emailChangeTokenNew: varchar("email_change_token_new", { length: 255 }),
	emailChange: varchar("email_change", { length: 255 }),
	emailChangeSentAt: timestamp("email_change_sent_at", { withTimezone: true, mode: 'string' }),
	lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true, mode: 'string' }),
	rawAppMetaData: jsonb("raw_app_meta_data"),
	rawUserMetaData: jsonb("raw_user_meta_data"),
	isSuperAdmin: boolean("is_super_admin"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	phone: text().default(sql`NULL`),
	phoneConfirmedAt: timestamp("phone_confirmed_at", { withTimezone: true, mode: 'string' }),
	phoneChange: text("phone_change").default('),
	phoneChangeToken: varchar("phone_change_token", { length: 255 }).default('),
	phoneChangeSentAt: timestamp("phone_change_sent_at", { withTimezone: true, mode: 'string' }),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }).generatedAlwaysAs(sql`LEAST(email_confirmed_at, phone_confirmed_at)`),
	emailChangeTokenCurrent: varchar("email_change_token_current", { length: 255 }).default('),
	emailChangeConfirmStatus: smallint("email_change_confirm_status").default(0),
	bannedUntil: timestamp("banned_until", { withTimezone: true, mode: 'string' }),
	reauthenticationToken: varchar("reauthentication_token", { length: 255 }).default('),
	reauthenticationSentAt: timestamp("reauthentication_sent_at", { withTimezone: true, mode: 'string' }),
	isSsoUser: boolean("is_sso_user").default(false).notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
}, (table) => [
	uniqueIndex("confirmation_token_idx").using("btree", table.confirmationToken.asc().nullsLast().op("text_ops")).where(sql`((confirmation_token)::text !~ '^[0-9 ]*$'::text)`),
	uniqueIndex("email_change_token_current_idx").using("btree", table.emailChangeTokenCurrent.asc().nullsLast().op("text_ops")).where(sql`((email_change_token_current)::text !~ '^[0-9 ]*$'::text)`),
	uniqueIndex("email_change_token_new_idx").using("btree", table.emailChangeTokenNew.asc().nullsLast().op("text_ops")).where(sql`((email_change_token_new)::text !~ '^[0-9 ]*$'::text)`),
	uniqueIndex("reauthentication_token_idx").using("btree", table.reauthenticationToken.asc().nullsLast().op("text_ops")).where(sql`((reauthentication_token)::text !~ '^[0-9 ]*$'::text)`),
	uniqueIndex("recovery_token_idx").using("btree", table.recoveryToken.asc().nullsLast().op("text_ops")).where(sql`((recovery_token)::text !~ '^[0-9 ]*$'::text)`),
	uniqueIndex("users_email_partial_key").using("btree", table.email.asc().nullsLast().op("text_ops")).where(sql`(is_sso_user = false)`),
	index("users_instance_id_email_idx").using("btree", sql`instance_id`, sql`lower((email)::text)`),
	index("users_instance_id_idx").using("btree", table.instanceId.asc().nullsLast().op("uuid_ops")),
	index("users_is_anonymous_idx").using("btree", table.isAnonymous.asc().nullsLast().op("bool_ops")),
	check("users_email_change_confirm_status_check", sql`(email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)`),
]);

export const identitiesInAuth = auth.table("identities", {
	providerId: text("provider_id").notNull(),
	userId: uuid("user_id").notNull(),
	identityData: jsonb("identity_data").notNull(),
	provider: text().notNull(),
	lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	email: text().generatedAlwaysAs(sql`lower((identity_data ->> 'email'::text))`),
	id: uuid().defaultRandom().notNull(),
}, (table) => [
	index("identities_email_idx").using("btree", table.email.asc().nullsLast().op("text_pattern_ops")),
	index("identities_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "identities_user_id_fkey"
		}).onDelete("cascade"),
]);

export const schemaMigrationsInAuth = auth.table("schema_migrations", {
	version: varchar({ length: 255 }).notNull(),
});

export const sessionsInAuth = auth.table("sessions", {
	id: uuid().notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	factorId: uuid("factor_id"),
	aal: aalLevelInAuth(),
	notAfter: timestamp("not_after", { withTimezone: true, mode: 'string' }),
	refreshedAt: timestamp("refreshed_at", { mode: 'string' }),
	userAgent: text("user_agent"),
	ip: inet(),
	tag: text(),
}, (table) => [
	index("sessions_not_after_idx").using("btree", table.notAfter.desc().nullsFirst().op("timestamptz_ops")),
	index("sessions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("user_id_created_at_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "sessions_user_id_fkey"
		}).onDelete("cascade"),
]);

export const mfaFactorsInAuth = auth.table("mfa_factors", {
	id: uuid().notNull(),
	userId: uuid("user_id").notNull(),
	friendlyName: text("friendly_name"),
	factorType: factorTypeInAuth("factor_type").notNull(),
	status: factorStatusInAuth().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	secret: text(),
	phone: text(),
	lastChallengedAt: timestamp("last_challenged_at", { withTimezone: true, mode: 'string' }),
	webAuthnCredential: jsonb("web_authn_credential"),
	webAuthnAaguid: uuid("web_authn_aaguid"),
}, (table) => [
	index("factor_id_created_at_idx").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("mfa_factors_user_friendly_name_unique").using("btree", table.friendlyName.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("uuid_ops")).where(sql`(TRIM(BOTH FROM friendly_name) <> ''::text)`),
	index("mfa_factors_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("unique_phone_factor_per_user").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.phone.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "mfa_factors_user_id_fkey"
		}).onDelete("cascade"),
]);

export const oneTimeTokensInAuth = auth.table("one_time_tokens", {
	id: uuid().notNull(),
	userId: uuid("user_id").notNull(),
	tokenType: oneTimeTokenTypeInAuth("token_type").notNull(),
	tokenHash: text("token_hash").notNull(),
	relatesTo: text("relates_to").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("one_time_tokens_relates_to_hash_idx").using("hash", table.relatesTo.asc().nullsLast().op("text_ops")),
	index("one_time_tokens_token_hash_hash_idx").using("hash", table.tokenHash.asc().nullsLast().op("text_ops")),
	uniqueIndex("one_time_tokens_user_id_token_type_key").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.tokenType.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "one_time_tokens_user_id_fkey"
		}).onDelete("cascade"),
	check("one_time_tokens_token_hash_check", sql`char_length(token_hash) > 0`),
]);

export const mfaChallengesInAuth = auth.table("mfa_challenges", {
	id: uuid().notNull(),
	factorId: uuid("factor_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	ipAddress: inet("ip_address").notNull(),
	otpCode: text("otp_code"),
	webAuthnSessionData: jsonb("web_authn_session_data"),
}, (table) => [
	index("mfa_challenge_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.factorId],
			foreignColumns: [mfaFactorsInAuth.id],
			name: "mfa_challenges_auth_factor_id_fkey"
		}).onDelete("cascade"),
]);

export const mfaAmrClaimsInAuth = auth.table("mfa_amr_claims", {
	sessionId: uuid("session_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	authenticationMethod: text("authentication_method").notNull(),
	id: uuid().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessionsInAuth.id],
			name: "mfa_amr_claims_session_id_fkey"
		}).onDelete("cascade"),
]);

export const ssoProvidersInAuth = auth.table("sso_providers", {
	id: uuid().notNull(),
	resourceId: text("resource_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("sso_providers_resource_id_idx").using("btree", sql`lower(resource_id)`),
	check("resource_id not empty", sql`(resource_id = NULL::text) OR (char_length(resource_id) > 0)`),
]);

export const auditLogEntriesInAuth = auth.table("audit_log_entries", {
	instanceId: uuid("instance_id"),
	id: uuid().notNull(),
	payload: json(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	ipAddress: varchar("ip_address", { length: 64 }).default(').notNull(),
}, (table) => [
	index("audit_logs_instance_id_idx").using("btree", table.instanceId.asc().nullsLast().op("uuid_ops")),
]);

export const organizationsInApp = app.table("organizations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	defaultCurrency: varchar("default_currency", { length: 10 }).default('USD').notNull(),
	companyName: text("company_name"),
	companyEmail: text("company_email"),
	companyLogoUrl: text("company_logo_url"),
	companyAddress: text("company_address"),
	companyPhone: text("company_phone"),
	companyWebsite: text("company_website"),
	defaultPaymentTerms: integer("default_payment_terms").default(30),
}, (table) => [
	pgPolicy("Users can view organizations they belong to", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.organization_id = organizations.id) AND (profiles.id = auth.uid()))))` }),
	pgPolicy("Admin users can manage organizations", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Users can create new organizations", { as: "permissive", for: "insert", to: ["public"] }),
]);

export const profilesInApp = app.table("profiles", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	fullName: text("full_name").notNull(),
	profilePictureUrl: text("profile_picture_url"),
	role: text().notNull(),
	companyName: text("company_name"),
	address: jsonb(),
	websiteUrl: text("website_url"),
	notes: text(),
	clientStatus: text("client_status"),
	source: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastLogin: timestamp("last_login", { withTimezone: true, mode: 'string' }),
	organizationId: uuid("organization_id"),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [usersInAuth.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationsInApp.id],
			name: "profiles_organization_id_fkey"
		}),
	unique("profiles_email_key").on(table.email),
	pgPolicy("profiles_select_own", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(auth.uid() = id)` }),
	pgPolicy("profiles_update_own", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("profiles_insert_authenticated", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("profiles_service_role_all", { as: "permissive", for: "all", to: ["service_role"] }),
	check("profiles_client_status_check", sql`client_status = ANY (ARRAY['lead'::text, 'active'::text, 'inactive'::text])`),
	check("profiles_role_check", sql`role = ANY (ARRAY['admin'::text, 'team_member'::text, 'client'::text])`),
]);

export const userRolesInApp = app.table("user_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	role: appRole().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "user_roles_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_roles_user_id_role_key").on(table.userId, table.role),
	pgPolicy("Users can view their roles", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Admin users can manage roles", { as: "permissive", for: "all", to: ["public"] }),
]);

export const invitesInApp = app.table("invites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	token: text().notNull(),
	organizationId: uuid("organization_id"),
	role: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	used: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationsInApp.id],
			name: "invites_organization_id_fkey"
		}),
	unique("invites_email_key").on(table.email),
	unique("invites_token_key").on(table.token),
	pgPolicy("Users can view invites", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("Only admins can create invites", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Anyone can update their own invites", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("invites_role_check", sql`role = ANY (ARRAY['admin'::text, 'client'::text, 'team_member'::text])`),
]);

export const organizationMembersInApp = app.table("organization_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	organizationId: uuid("organization_id"),
	role: text().default('member').notNull(),
	isPrimary: boolean("is_primary").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationsInApp.id],
			name: "organization_members_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "organization_members_user_id_fkey"
		}).onDelete("cascade"),
	unique("organization_members_user_id_organization_id_key").on(table.userId, table.organizationId),
	pgPolicy("Users can view their own organization memberships", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can create their own organization memberships", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins can manage organization members", { as: "permissive", for: "all", to: ["public"] }),
]);

export const projectsInApp = app.table("projects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	status: text().default('draft').notNull(),
	priority: text().default('medium'),
	clientId: uuid("client_id"),
	startDate: date("start_date"),
	endDate: date("end_date"),
	budget: numeric({ precision: 12, scale:  2 }),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	organizationId: uuid("organization_id").notNull(),
}, (table) => [
	index("idx_projects_client_id").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_projects_client_status").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("idx_projects_dates").using("btree", table.startDate.asc().nullsLast().op("date_ops"), table.endDate.asc().nullsLast().op("date_ops")),
	index("idx_projects_name_search").using("gin", sql`to_tsvector('english'::regconfig, name)`),
	index("idx_projects_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [profilesInApp.id],
			name: "projects_client_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profilesInApp.id],
			name: "projects_created_by_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationsInApp.id],
			name: "projects_organization_id_fkey"
		}),
	pgPolicy("Admins and team members can create projects", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'team_member'::text])))))`  }),
	pgPolicy("Admins can delete projects", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("Users can read projects they're assigned to or are clients of", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Project team members and admins can update projects", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("projects_priority_check", sql`priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])`),
	check("projects_status_check", sql`status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'archived'::text])`),
]);

export const projectTeamInApp = app.table("project_team", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: uuid("project_id"),
	userId: uuid("user_id"),
	role: text().default('member').notNull(),
	permissions: jsonb().default({}),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsInApp.id],
			name: "project_team_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profilesInApp.id],
			name: "project_team_user_id_fkey"
		}).onDelete("cascade"),
	unique("project_team_project_id_user_id_key").on(table.projectId, table.userId),
	pgPolicy("Users can read project team assignments", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Project team members and admins can manage project team", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const tasksInApp = app.table("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: uuid("project_id"),
	parentTaskId: uuid("parent_task_id"),
	title: text().notNull(),
	description: text(),
	status: text().default('todo').notNull(),
	priority: text().default('medium'),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	estimatedHours: numeric("estimated_hours", { precision: 8, scale:  2 }),
	actualHours: numeric("actual_hours", { precision: 8, scale:  2 }),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tasks_due_date").using("btree", table.dueDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_tasks_project_id").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("idx_tasks_project_status").using("btree", table.projectId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("idx_tasks_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_tasks_title_search").using("gin", sql`to_tsvector('english'::regconfig, title)`),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profilesInApp.id],
			name: "tasks_created_by_fkey"
		}),
	foreignKey({
			columns: [table.parentTaskId],
			foreignColumns: [table.id],
			name: "tasks_parent_task_id_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsInApp.id],
			name: "tasks_project_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can read tasks from their projects", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((project_id IN ( SELECT project_team.project_id
   FROM app.project_team
  WHERE (project_team.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.projects
  WHERE ((projects.id = tasks.project_id) AND (projects.client_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Project team members can manage tasks", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("tasks_priority_check", sql`priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])`),
	check("tasks_status_check", sql`status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'review'::text, 'completed'::text, 'cancelled'::text])`),
]);

export const taskAssignmentsInApp = app.table("task_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id"),
	userId: uuid("user_id"),
	assignedBy: uuid("assigned_by").notNull(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [profilesInApp.id],
			name: "task_assignments_assigned_by_fkey"
		}),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasksInApp.id],
			name: "task_assignments_task_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profilesInApp.id],
			name: "task_assignments_user_id_fkey"
		}).onDelete("cascade"),
	unique("task_assignments_task_id_user_id_key").on(table.taskId, table.userId),
	pgPolicy("Users can read task assignments", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((user_id = auth.uid()) OR (task_id IN ( SELECT tasks.id
   FROM app.tasks
  WHERE (tasks.project_id IN ( SELECT project_team.project_id
           FROM app.project_team
          WHERE (project_team.user_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Project team members can manage task assignments", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const filesInApp = app.table("files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	filename: text().notNull(),
	originalFilename: text("original_filename").notNull(),
	filePath: text("file_path").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }).notNull(),
	mimeType: text("mime_type").notNull(),
	uploadedBy: uuid("uploaded_by").notNull(),
	projectId: uuid("project_id"),
	description: text(),
	isPublic: boolean("is_public").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_files_project_id").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsInApp.id],
			name: "files_project_id_fkey"
		}),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [profilesInApp.id],
			name: "files_uploaded_by_fkey"
		}),
	pgPolicy("Users can read files they uploaded or have access to", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((uploaded_by = auth.uid()) OR (is_public = true) OR (id IN ( SELECT file_shares.file_id
   FROM app.file_shares
  WHERE (file_shares.shared_with = auth.uid()))) OR (project_id IN ( SELECT project_team.project_id
   FROM app.project_team
  WHERE (project_team.user_id = auth.uid()))) OR (project_id IN ( SELECT projects.id
   FROM app.projects
  WHERE (projects.client_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Users can upload files to their projects", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Project team members and admins can update files", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Project team members and admins can delete files", { as: "permissive", for: "delete", to: ["authenticated"] }),
]);

export const fileSharesInApp = app.table("file_shares", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fileId: uuid("file_id"),
	sharedWith: uuid("shared_with"),
	permission: text().default('view'),
	sharedBy: uuid("shared_by").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [filesInApp.id],
			name: "file_shares_file_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sharedBy],
			foreignColumns: [profilesInApp.id],
			name: "file_shares_shared_by_fkey"
		}),
	foreignKey({
			columns: [table.sharedWith],
			foreignColumns: [profilesInApp.id],
			name: "file_shares_shared_with_fkey"
		}).onDelete("cascade"),
	unique("file_shares_file_id_shared_with_key").on(table.fileId, table.sharedWith),
	pgPolicy("Users can manage file shares for files they own or manage", { as: "permissive", for: "all", to: ["authenticated"], using: sql`((shared_by = auth.uid()) OR (file_id IN ( SELECT files.id
   FROM app.files
  WHERE (files.uploaded_by = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	check("file_shares_permission_check", sql`permission = ANY (ARRAY['view'::text, 'download'::text, 'edit'::text])`),
]);

export const calendarEventsInApp = app.table("calendar_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	projectId: uuid("project_id"),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	location: text(),
	eventType: text("event_type").default('meeting'),
	status: text().default('scheduled'),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_calendar_events_date_range").using("btree", table.startTime.asc().nullsLast().op("timestamptz_ops"), table.endTime.asc().nullsLast().op("timestamptz_ops")),
	index("idx_calendar_events_start_time").using("btree", table.startTime.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profilesInApp.id],
			name: "calendar_events_created_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsInApp.id],
			name: "calendar_events_project_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Users can read events they're invited to", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((created_by = auth.uid()) OR app.is_attendee_of_event(id, auth.uid()) OR app.is_member_of_project(project_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM app.projects
  WHERE ((projects.id = calendar_events.project_id) AND (projects.client_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Team members and admins can manage calendar events", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("calendar_events_event_type_check", sql`event_type = ANY (ARRAY['meeting'::text, 'deadline'::text, 'milestone'::text, 'reminder'::text])`),
	check("calendar_events_status_check", sql`status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text])`),
]);

export const eventAttendeesInApp = app.table("event_attendees", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id"),
	userId: uuid("user_id"),
	response: text().default('pending'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [calendarEventsInApp.id],
			name: "event_attendees_event_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profilesInApp.id],
			name: "event_attendees_user_id_fkey"
		}).onDelete("cascade"),
	unique("event_attendees_event_id_user_id_key").on(table.eventId, table.userId),
	pgPolicy("Users can read event attendees for events they can access", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM app.calendar_events
  WHERE ((calendar_events.id = event_attendees.event_id) AND ((calendar_events.created_by = auth.uid()) OR app.is_member_of_project(calendar_events.project_id, auth.uid()) OR (EXISTS ( SELECT 1
           FROM app.profiles
          WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))))))` }),
	pgPolicy("Event creators and admins can manage event attendees", { as: "permissive", for: "all", to: ["authenticated"] }),
	pgPolicy("Users can manage their own event attendance", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("event_attendees_response_check", sql`response = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'tentative'::text])`),
]);

export const milestonesInApp = app.table("milestones", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: uuid("project_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	dueDate: date("due_date"),
	status: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsInApp.id],
			name: "milestones_project_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view milestones for their projects", { as: "permissive", for: "select", to: ["public"], using: sql`((project_id IN ( SELECT project_team.project_id
   FROM app.project_team
  WHERE (project_team.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.projects
  WHERE ((projects.id = milestones.project_id) AND (projects.client_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Project team members can manage milestones", { as: "permissive", for: "all", to: ["public"] }),
]);

export const deliverablesInApp = app.table("deliverables", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	milestoneId: uuid("milestone_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	dueDate: date("due_date"),
	status: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.milestoneId],
			foreignColumns: [milestonesInApp.id],
			name: "deliverables_milestone_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view deliverables for their milestones/projects", { as: "permissive", for: "select", to: ["public"], using: sql`((milestone_id IN ( SELECT milestones.id
   FROM app.milestones
  WHERE (milestones.project_id IN ( SELECT project_team.project_id
           FROM app.project_team
          WHERE (project_team.user_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (app.milestones m
     JOIN app.projects p ON ((m.project_id = p.id)))
  WHERE ((m.id = deliverables.milestone_id) AND (p.client_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Project team members can manage deliverables", { as: "permissive", for: "all", to: ["public"] }),
]);

export const documentsInApp = app.table("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	content: text(),
	organizationId: uuid("organization_id").notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profilesInApp.id],
			name: "documents_created_by_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationsInApp.id],
			name: "documents_organization_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view documents from their organization", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.organization_id = documents.organization_id))))` }),
	pgPolicy("Admin users can manage all documents", { as: "permissive", for: "all", to: ["public"] }),
]);

export const estimatesInFinance = finance.table("estimates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	referenceNumber: varchar("reference_number", { length: 50 }).notNull(),
	organizationId: uuid("organization_id").notNull(),
	projectId: uuid("project_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	issueDate: date("issue_date").notNull(),
	expiryDate: date("expiry_date").notNull(),
	status: varchar({ length: 50 }).default('draft').notNull(),
	notes: text(),
	terms: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	companyName: text("company_name"),
	companyAddress: text("company_address"),
	companyEmail: text("company_email"),
	companyPhone: text("company_phone"),
	deleted: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationsInApp.id],
			name: "estimates_organization_id_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsInApp.id],
			name: "estimates_project_id_fkey"
		}),
	pgPolicy("Users can view estimates for their organization/projects", { as: "permissive", for: "select", to: ["public"], using: sql`((organization_id IN ( SELECT p.organization_id
   FROM app.profiles p
  WHERE (p.id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.projects pr
  WHERE ((pr.id = estimates.project_id) AND ((pr.client_id = auth.uid()) OR (pr.id IN ( SELECT pt.project_id
           FROM app.project_team pt
          WHERE (pt.user_id = auth.uid()))))))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Users can create estimates for their organization/projects", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update estimates for their organization/projects", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can delete estimates for their organization/projects", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const estimateItemsInFinance = finance.table("estimate_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	estimateId: uuid("estimate_id").notNull(),
	description: text().notNull(),
	quantity: numeric({ precision: 10, scale:  2 }).default('1').notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	billable: boolean().default(true).notNull(),
	unitType: text("unit_type").default('hours').notNull(),
	deleted: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.estimateId],
			foreignColumns: [estimatesInFinance.id],
			name: "estimate_items_estimate_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view estimate items related to their estimates", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM finance.estimates e
  WHERE ((e.id = estimate_items.estimate_id) AND ((e.organization_id IN ( SELECT p.organization_id
           FROM app.profiles p
          WHERE (p.id = auth.uid()))) OR (EXISTS ( SELECT 1
           FROM app.projects pr
          WHERE ((pr.id = e.project_id) AND ((pr.client_id = auth.uid()) OR (pr.id IN ( SELECT pt.project_id
                   FROM app.project_team pt
                  WHERE (pt.user_id = auth.uid())))))))))))` }),
	pgPolicy("Users can manage estimate items related to their estimates", { as: "permissive", for: "all", to: ["public"] }),
	check("estimate_items_unit_type_check", sql`unit_type = ANY (ARRAY['hours'::text, 'days'::text, 'months'::text, 'fixed'::text])`),
]);

export const quotesInFinance = finance.table("quotes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	referenceNumber: varchar("reference_number").notNull(),
	organizationId: uuid("organization_id").notNull(),
	projectId: uuid("project_id"),
	amount: numeric().notNull(),
	issueDate: date("issue_date").notNull(),
	expiryDate: date("expiry_date").notNull(),
	status: varchar().default('draft').notNull(),
	notes: text(),
	terms: text(),
	estimateId: uuid("estimate_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("quotes_estimate_id_idx").using("btree", table.estimateId.asc().nullsLast().op("uuid_ops")),
	index("quotes_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("quotes_project_id_idx").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("quotes_reference_number_idx").using("btree", table.referenceNumber.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.estimateId],
			foreignColumns: [estimatesInFinance.id],
			name: "quotes_estimate_id_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationsInApp.id],
			name: "quotes_organization_id_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsInApp.id],
			name: "quotes_project_id_fkey"
		}),
	pgPolicy("Users can view quotes for their organization/projects", { as: "permissive", for: "select", to: ["public"], using: sql`((organization_id IN ( SELECT p.organization_id
   FROM app.profiles p
  WHERE (p.id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.projects pr
  WHERE ((pr.id = quotes.project_id) AND ((pr.client_id = auth.uid()) OR (pr.id IN ( SELECT pt.project_id
           FROM app.project_team pt
          WHERE (pt.user_id = auth.uid()))))))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Users can manage quotes for their organization/projects", { as: "permissive", for: "all", to: ["public"] }),
]);

export const quoteItemsInFinance = finance.table("quote_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quoteId: uuid("quote_id").notNull(),
	description: text().notNull(),
	quantity: numeric().default('1').notNull(),
	unitPrice: numeric("unit_price").notNull(),
	amount: numeric().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("quote_items_quote_id_idx").using("btree", table.quoteId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.quoteId],
			foreignColumns: [quotesInFinance.id],
			name: "quote_items_quote_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view quote items related to their quotes", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM finance.quotes q
  WHERE ((q.id = quote_items.quote_id) AND ((q.organization_id IN ( SELECT p.organization_id
           FROM app.profiles p
          WHERE (p.id = auth.uid()))) OR (EXISTS ( SELECT 1
           FROM app.projects pr
          WHERE ((pr.id = q.project_id) AND ((pr.client_id = auth.uid()) OR (pr.id IN ( SELECT pt.project_id
                   FROM app.project_team pt
                  WHERE (pt.user_id = auth.uid())))))))))))` }),
	pgPolicy("Users can manage quote items related to their quotes", { as: "permissive", for: "all", to: ["public"] }),
]);

export const invoicesInFinance = finance.table("invoices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceNumber: text("invoice_number").notNull(),
	projectId: uuid("project_id"),
	clientId: uuid("client_id").notNull(),
	status: text().default('draft'),
	issueDate: date("issue_date").notNull(),
	dueDate: date("due_date").notNull(),
	subtotal: numeric({ precision: 12, scale:  2 }).default('0').notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale:  2 }).default('0'),
	taxAmount: numeric("tax_amount", { precision: 12, scale:  2 }).default('0'),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).default('0').notNull(),
	notes: text(),
	terms: text(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	organizationId: uuid("organization_id").notNull(),
	estimateId: uuid("estimate_id"),
	purchaseOrder: varchar("purchase_order", { length: 50 }),
	tax: numeric().default('0').notNull(),
	logoUrl: text("logo_url"),
	isRecurring: boolean("is_recurring").default(false),
	recurringFrequency: recurringFrequencyType("recurring_frequency"),
	recurringStartDate: date("recurring_start_date"),
	recurringUntil: recurringUntilType("recurring_until"),
	recurringEndDate: date("recurring_end_date"),
	recurringCount: integer("recurring_count"),
	duplicatedFromId: uuid("duplicated_from_id"),
	recurringTemplateId: uuid("recurring_template_id"),
}, (table) => [
	index("idx_invoices_client_id").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_invoices_client_id_old").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_invoices_client_status").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_invoices_dates").using("btree", table.issueDate.asc().nullsLast().op("date_ops"), table.dueDate.asc().nullsLast().op("date_ops")),
	index("idx_invoices_duplicated_from_id").using("btree", table.duplicatedFromId.asc().nullsLast().op("uuid_ops")),
	index("idx_invoices_estimate_id").using("btree", table.estimateId.asc().nullsLast().op("uuid_ops")),
	index("idx_invoices_is_recurring").using("btree", table.isRecurring.asc().nullsLast().op("bool_ops")),
	index("idx_invoices_organization_created_at").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_invoices_recurring_template_id").using("btree", table.recurringTemplateId.asc().nullsLast().op("uuid_ops")),
	index("idx_invoices_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [profilesInApp.id],
			name: "invoices_client_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profilesInApp.id],
			name: "invoices_created_by_fkey"
		}),
	foreignKey({
			columns: [table.duplicatedFromId],
			foreignColumns: [table.id],
			name: "invoices_duplicated_from_id_fkey"
		}),
	foreignKey({
			columns: [table.estimateId],
			foreignColumns: [estimatesInFinance.id],
			name: "invoices_estimate_id_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationsInApp.id],
			name: "invoices_organization_id_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsInApp.id],
			name: "invoices_project_id_fkey"
		}).onDelete("set null"),
	unique("invoices_invoice_number_key").on(table.invoiceNumber),
	pgPolicy("Users can read invoices for their projects", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((client_id = auth.uid()) OR (project_id IN ( SELECT project_team.project_id
   FROM app.project_team
  WHERE (project_team.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Team members can manage invoices", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("invoices_status_check", sql`status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text, 'partial'::text])`),
]);

export const invoiceItemsInFinance = finance.table("invoice_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceId: uuid("invoice_id"),
	description: text().notNull(),
	quantity: numeric({ precision: 10, scale:  2 }).default('1').notNull(),
	unitPrice: numeric("unit_price", { precision: 12, scale:  2 }).notNull(),
	totalPrice: numeric("total_price", { precision: 12, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale:  2 }).default('0'),
	discountRate: numeric("discount_rate", { precision: 5, scale:  2 }).default('0'),
}, (table) => [
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoicesInFinance.id],
			name: "invoice_items_invoice_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view invoice items related to their invoices", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM finance.invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND ((i.client_id = auth.uid()) OR (i.project_id IN ( SELECT pt.project_id
           FROM app.project_team pt
          WHERE (pt.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
           FROM app.profiles
          WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))))))` }),
	pgPolicy("Team members can manage invoice items", { as: "permissive", for: "all", to: ["public"] }),
]);

export const paymentsInFinance = finance.table("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceId: uuid("invoice_id"),
	paymentMethod: text("payment_method").default('stripe'),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	transactionId: text("transaction_id"),
	stripePaymentIntentId: text("stripe_payment_intent_id"),
	status: text().default('pending'),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoicesInFinance.id],
			name: "payments_invoice_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Users can view payments for their invoices", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM finance.invoices i
  WHERE ((i.id = payments.invoice_id) AND ((i.client_id = auth.uid()) OR (i.project_id IN ( SELECT pt.project_id
           FROM app.project_team pt
          WHERE (pt.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
           FROM app.profiles
          WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))))))` }),
	pgPolicy("Team members can manage payments", { as: "permissive", for: "all", to: ["public"] }),
	check("payments_payment_method_check", sql`payment_method = ANY (ARRAY['credit_card'::text, 'bank_transfer'::text, 'check'::text, 'cash'::text, 'stripe'::text])`),
	check("payments_status_check", sql`status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])`),
]);

export const recurringInvoiceTemplatesInFinance = finance.table("recurring_invoice_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	projectId: uuid("project_id"),
	clientId: uuid("client_id"),
	templateName: varchar("template_name", { length: 255 }).notNull(),
	isActive: boolean("is_active").default(true),
	invoiceData: jsonb("invoice_data").notNull(),
	frequency: recurringFrequencyType().notNull(),
	startDate: date("start_date").notNull(),
	untilType: recurringUntilType("until_type").default('indefinitely').notNull(),
	endDate: date("end_date"),
	maxCount: integer("max_count"),
	nextGenerationDate: date("next_generation_date").notNull(),
	generationCount: integer("generation_count").default(0),
	lastGeneratedAt: timestamp("last_generated_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
}, (table) => [
	index("idx_recurring_templates_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_recurring_templates_next_generation").using("btree", table.nextGenerationDate.asc().nullsLast().op("date_ops")).where(sql`(is_active = true)`),
	index("idx_recurring_templates_organization_id").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [profilesInApp.id],
			name: "recurring_invoice_templates_client_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [usersInAuth.id],
			name: "recurring_invoice_templates_created_by_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationsInApp.id],
			name: "recurring_invoice_templates_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsInApp.id],
			name: "recurring_invoice_templates_project_id_fkey"
		}),
	pgPolicy("Users can view recurring templates for their organization", { as: "permissive", for: "select", to: ["public"], using: sql`(organization_id IN ( SELECT profiles.organization_id
   FROM app.profiles
  WHERE (profiles.id = auth.uid())))` }),
	pgPolicy("Users can create recurring templates for their organization", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update recurring templates for their organization", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can delete recurring templates for their organization", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const recurringInvoiceHistoryInFinance = finance.table("recurring_invoice_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	templateId: uuid("template_id").notNull(),
	invoiceId: uuid("invoice_id"),
	generatedAt: timestamp("generated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	generationDate: date("generation_date").notNull(),
	status: varchar({ length: 20 }).default('success'),
	errorMessage: text("error_message"),
	invoiceData: jsonb("invoice_data"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_recurring_history_generation_date").using("btree", table.generationDate.asc().nullsLast().op("date_ops")),
	index("idx_recurring_history_template_id").using("btree", table.templateId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoicesInFinance.id],
			name: "recurring_invoice_history_invoice_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [recurringInvoiceTemplatesInFinance.id],
			name: "recurring_invoice_history_template_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view recurring history for their organization templat", { as: "permissive", for: "select", to: ["public"], using: sql`(template_id IN ( SELECT rt.id
   FROM (finance.recurring_invoice_templates rt
     JOIN app.profiles p ON ((p.organization_id = rt.organization_id)))
  WHERE (p.id = auth.uid())))` }),
	pgPolicy("System can manage recurring invoice history", { as: "permissive", for: "all", to: ["service_role"] }),
	check("recurring_invoice_history_status_check", sql`(status)::text = ANY ((ARRAY['success'::character varying, 'failed'::character varying, 'skipped'::character varying])::text[])`),
]);

export const messageThreadsInMessaging = messaging.table("message_threads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: uuid("project_id"),
	subject: text().notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profilesInApp.id],
			name: "message_threads_created_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsInApp.id],
			name: "message_threads_project_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can read threads for their projects", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((project_id IN ( SELECT project_team.project_id
   FROM app.project_team
  WHERE (project_team.user_id = auth.uid()))) OR (project_id IN ( SELECT projects.id
   FROM app.projects
  WHERE (projects.client_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Project members can create threads", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Project members can update threads", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const messagesInMessaging = messaging.table("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id"),
	senderId: uuid("sender_id").notNull(),
	content: text().notNull(),
	messageType: text("message_type").default('text'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	editedAt: timestamp("edited_at", { withTimezone: true, mode: 'string' }),
	isDeleted: boolean("is_deleted").default(false),
}, (table) => [
	index("idx_messages_content_search").using("gin", sql`to_tsvector('english'::regconfig, content)`),
	index("idx_messages_thread_id").using("btree", table.threadId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [profilesInApp.id],
			name: "messages_sender_id_fkey"
		}),
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [messageThreadsInMessaging.id],
			name: "messages_thread_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can delete their own messages", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(sender_id = auth.uid())` }),
	pgPolicy("Users can read messages in their threads", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Users can send messages in their threads", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can update their own messages", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("messages_message_type_check", sql`message_type = ANY (ARRAY['text'::text, 'system'::text, 'file'::text])`),
]);

export const messageRecipientsInMessaging = messaging.table("message_recipients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	messageId: uuid("message_id"),
	userId: uuid("user_id"),
	readStatus: boolean("read_status").default(false),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messagesInMessaging.id],
			name: "message_recipients_message_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profilesInApp.id],
			name: "message_recipients_user_id_fkey"
		}).onDelete("cascade"),
	unique("message_recipients_message_id_user_id_key").on(table.messageId, table.userId),
	pgPolicy("Users can manage their message read status", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(user_id = auth.uid())` }),
]);

export const threadParticipantsInMessaging = messaging.table("thread_participants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id"),
	userId: uuid("user_id"),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastReadAt: timestamp("last_read_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [messageThreadsInMessaging.id],
			name: "thread_participants_thread_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profilesInApp.id],
			name: "thread_participants_user_id_fkey"
		}).onDelete("cascade"),
	unique("thread_participants_thread_id_user_id_key").on(table.threadId, table.userId),
	pgPolicy("Users can read thread participants", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((thread_id IN ( SELECT message_threads.id
   FROM messaging.message_threads
  WHERE ((message_threads.project_id IN ( SELECT project_team.project_id
           FROM app.project_team
          WHERE (project_team.user_id = auth.uid()))) OR (message_threads.project_id IN ( SELECT projects.id
           FROM app.projects
          WHERE (projects.client_id = auth.uid())))))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("Project members can manage thread participants", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const auditLogsInAudit = audit.table("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	action: text().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	details: jsonb(),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "audit_logs_user_id_fkey"
		}),
	pgPolicy("Users can read their own audit logs", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Admins can read all audit logs", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

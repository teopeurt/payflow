import { relations } from "drizzle-orm/relations";
import { ssoProvidersInAuth, samlProvidersInAuth, flowStateInAuth, samlRelayStatesInAuth, sessionsInAuth, refreshTokensInAuth, ssoDomainsInAuth, usersInAuth, identitiesInAuth, mfaFactorsInAuth, oneTimeTokensInAuth, mfaChallengesInAuth, mfaAmrClaimsInAuth, profilesInApp, organizationsInApp, userRolesInApp, invitesInApp, organizationMembersInApp, projectsInApp, projectTeamInApp, tasksInApp, taskAssignmentsInApp, filesInApp, fileSharesInApp, calendarEventsInApp, eventAttendeesInApp, milestonesInApp, deliverablesInApp, documentsInApp, estimatesInFinance, estimateItemsInFinance, quotesInFinance, quoteItemsInFinance, invoicesInFinance, invoiceItemsInFinance, paymentsInFinance, recurringInvoiceTemplatesInFinance, recurringInvoiceHistoryInFinance, messageThreadsInMessaging, messagesInMessaging, messageRecipientsInMessaging, threadParticipantsInMessaging, auditLogsInAudit } from "./schema";

export const samlProvidersInAuthRelations = relations(samlProvidersInAuth, ({one}) => ({
	ssoProvidersInAuth: one(ssoProvidersInAuth, {
		fields: [samlProvidersInAuth.ssoProviderId],
		references: [ssoProvidersInAuth.id]
	}),
}));

export const ssoProvidersInAuthRelations = relations(ssoProvidersInAuth, ({many}) => ({
	samlProvidersInAuths: many(samlProvidersInAuth),
	samlRelayStatesInAuths: many(samlRelayStatesInAuth),
	ssoDomainsInAuths: many(ssoDomainsInAuth),
}));

export const samlRelayStatesInAuthRelations = relations(samlRelayStatesInAuth, ({one}) => ({
	flowStateInAuth: one(flowStateInAuth, {
		fields: [samlRelayStatesInAuth.flowStateId],
		references: [flowStateInAuth.id]
	}),
	ssoProvidersInAuth: one(ssoProvidersInAuth, {
		fields: [samlRelayStatesInAuth.ssoProviderId],
		references: [ssoProvidersInAuth.id]
	}),
}));

export const flowStateInAuthRelations = relations(flowStateInAuth, ({many}) => ({
	samlRelayStatesInAuths: many(samlRelayStatesInAuth),
}));

export const refreshTokensInAuthRelations = relations(refreshTokensInAuth, ({one}) => ({
	sessionsInAuth: one(sessionsInAuth, {
		fields: [refreshTokensInAuth.sessionId],
		references: [sessionsInAuth.id]
	}),
}));

export const sessionsInAuthRelations = relations(sessionsInAuth, ({one, many}) => ({
	refreshTokensInAuths: many(refreshTokensInAuth),
	usersInAuth: one(usersInAuth, {
		fields: [sessionsInAuth.userId],
		references: [usersInAuth.id]
	}),
	mfaAmrClaimsInAuths: many(mfaAmrClaimsInAuth),
}));

export const ssoDomainsInAuthRelations = relations(ssoDomainsInAuth, ({one}) => ({
	ssoProvidersInAuth: one(ssoProvidersInAuth, {
		fields: [ssoDomainsInAuth.ssoProviderId],
		references: [ssoProvidersInAuth.id]
	}),
}));

export const identitiesInAuthRelations = relations(identitiesInAuth, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [identitiesInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	identitiesInAuths: many(identitiesInAuth),
	sessionsInAuths: many(sessionsInAuth),
	mfaFactorsInAuths: many(mfaFactorsInAuth),
	oneTimeTokensInAuths: many(oneTimeTokensInAuth),
	profilesInApps: many(profilesInApp),
	userRolesInApps: many(userRolesInApp),
	organizationMembersInApps: many(organizationMembersInApp),
	recurringInvoiceTemplatesInFinances: many(recurringInvoiceTemplatesInFinance),
	auditLogsInAudits: many(auditLogsInAudit),
}));

export const mfaFactorsInAuthRelations = relations(mfaFactorsInAuth, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [mfaFactorsInAuth.userId],
		references: [usersInAuth.id]
	}),
	mfaChallengesInAuths: many(mfaChallengesInAuth),
}));

export const oneTimeTokensInAuthRelations = relations(oneTimeTokensInAuth, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [oneTimeTokensInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const mfaChallengesInAuthRelations = relations(mfaChallengesInAuth, ({one}) => ({
	mfaFactorsInAuth: one(mfaFactorsInAuth, {
		fields: [mfaChallengesInAuth.factorId],
		references: [mfaFactorsInAuth.id]
	}),
}));

export const mfaAmrClaimsInAuthRelations = relations(mfaAmrClaimsInAuth, ({one}) => ({
	sessionsInAuth: one(sessionsInAuth, {
		fields: [mfaAmrClaimsInAuth.sessionId],
		references: [sessionsInAuth.id]
	}),
}));

export const profilesInAppRelations = relations(profilesInApp, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [profilesInApp.id],
		references: [usersInAuth.id]
	}),
	organizationsInApp: one(organizationsInApp, {
		fields: [profilesInApp.organizationId],
		references: [organizationsInApp.id]
	}),
	projectsInApps_clientId: many(projectsInApp, {
		relationName: "projectsInApp_clientId_profilesInApp_id"
	}),
	projectsInApps_createdBy: many(projectsInApp, {
		relationName: "projectsInApp_createdBy_profilesInApp_id"
	}),
	projectTeamInApps: many(projectTeamInApp),
	tasksInApps: many(tasksInApp),
	taskAssignmentsInApps_assignedBy: many(taskAssignmentsInApp, {
		relationName: "taskAssignmentsInApp_assignedBy_profilesInApp_id"
	}),
	taskAssignmentsInApps_userId: many(taskAssignmentsInApp, {
		relationName: "taskAssignmentsInApp_userId_profilesInApp_id"
	}),
	filesInApps: many(filesInApp),
	fileSharesInApps_sharedBy: many(fileSharesInApp, {
		relationName: "fileSharesInApp_sharedBy_profilesInApp_id"
	}),
	fileSharesInApps_sharedWith: many(fileSharesInApp, {
		relationName: "fileSharesInApp_sharedWith_profilesInApp_id"
	}),
	calendarEventsInApps: many(calendarEventsInApp),
	eventAttendeesInApps: many(eventAttendeesInApp),
	documentsInApps: many(documentsInApp),
	invoicesInFinances_clientId: many(invoicesInFinance, {
		relationName: "invoicesInFinance_clientId_profilesInApp_id"
	}),
	invoicesInFinances_createdBy: many(invoicesInFinance, {
		relationName: "invoicesInFinance_createdBy_profilesInApp_id"
	}),
	recurringInvoiceTemplatesInFinances: many(recurringInvoiceTemplatesInFinance),
	messageThreadsInMessagings: many(messageThreadsInMessaging),
	messagesInMessagings: many(messagesInMessaging),
	messageRecipientsInMessagings: many(messageRecipientsInMessaging),
	threadParticipantsInMessagings: many(threadParticipantsInMessaging),
}));

export const organizationsInAppRelations = relations(organizationsInApp, ({many}) => ({
	profilesInApps: many(profilesInApp),
	invitesInApps: many(invitesInApp),
	organizationMembersInApps: many(organizationMembersInApp),
	projectsInApps: many(projectsInApp),
	documentsInApps: many(documentsInApp),
	estimatesInFinances: many(estimatesInFinance),
	quotesInFinances: many(quotesInFinance),
	invoicesInFinances: many(invoicesInFinance),
	recurringInvoiceTemplatesInFinances: many(recurringInvoiceTemplatesInFinance),
}));

export const userRolesInAppRelations = relations(userRolesInApp, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [userRolesInApp.userId],
		references: [usersInAuth.id]
	}),
}));

export const invitesInAppRelations = relations(invitesInApp, ({one}) => ({
	organizationsInApp: one(organizationsInApp, {
		fields: [invitesInApp.organizationId],
		references: [organizationsInApp.id]
	}),
}));

export const organizationMembersInAppRelations = relations(organizationMembersInApp, ({one}) => ({
	organizationsInApp: one(organizationsInApp, {
		fields: [organizationMembersInApp.organizationId],
		references: [organizationsInApp.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [organizationMembersInApp.userId],
		references: [usersInAuth.id]
	}),
}));

export const projectsInAppRelations = relations(projectsInApp, ({one, many}) => ({
	profilesInApp_clientId: one(profilesInApp, {
		fields: [projectsInApp.clientId],
		references: [profilesInApp.id],
		relationName: "projectsInApp_clientId_profilesInApp_id"
	}),
	profilesInApp_createdBy: one(profilesInApp, {
		fields: [projectsInApp.createdBy],
		references: [profilesInApp.id],
		relationName: "projectsInApp_createdBy_profilesInApp_id"
	}),
	organizationsInApp: one(organizationsInApp, {
		fields: [projectsInApp.organizationId],
		references: [organizationsInApp.id]
	}),
	projectTeamInApps: many(projectTeamInApp),
	tasksInApps: many(tasksInApp),
	filesInApps: many(filesInApp),
	calendarEventsInApps: many(calendarEventsInApp),
	milestonesInApps: many(milestonesInApp),
	estimatesInFinances: many(estimatesInFinance),
	quotesInFinances: many(quotesInFinance),
	invoicesInFinances: many(invoicesInFinance),
	recurringInvoiceTemplatesInFinances: many(recurringInvoiceTemplatesInFinance),
	messageThreadsInMessagings: many(messageThreadsInMessaging),
}));

export const projectTeamInAppRelations = relations(projectTeamInApp, ({one}) => ({
	projectsInApp: one(projectsInApp, {
		fields: [projectTeamInApp.projectId],
		references: [projectsInApp.id]
	}),
	profilesInApp: one(profilesInApp, {
		fields: [projectTeamInApp.userId],
		references: [profilesInApp.id]
	}),
}));

export const tasksInAppRelations = relations(tasksInApp, ({one, many}) => ({
	profilesInApp: one(profilesInApp, {
		fields: [tasksInApp.createdBy],
		references: [profilesInApp.id]
	}),
	tasksInApp: one(tasksInApp, {
		fields: [tasksInApp.parentTaskId],
		references: [tasksInApp.id],
		relationName: "tasksInApp_parentTaskId_tasksInApp_id"
	}),
	tasksInApps: many(tasksInApp, {
		relationName: "tasksInApp_parentTaskId_tasksInApp_id"
	}),
	projectsInApp: one(projectsInApp, {
		fields: [tasksInApp.projectId],
		references: [projectsInApp.id]
	}),
	taskAssignmentsInApps: many(taskAssignmentsInApp),
}));

export const taskAssignmentsInAppRelations = relations(taskAssignmentsInApp, ({one}) => ({
	profilesInApp_assignedBy: one(profilesInApp, {
		fields: [taskAssignmentsInApp.assignedBy],
		references: [profilesInApp.id],
		relationName: "taskAssignmentsInApp_assignedBy_profilesInApp_id"
	}),
	tasksInApp: one(tasksInApp, {
		fields: [taskAssignmentsInApp.taskId],
		references: [tasksInApp.id]
	}),
	profilesInApp_userId: one(profilesInApp, {
		fields: [taskAssignmentsInApp.userId],
		references: [profilesInApp.id],
		relationName: "taskAssignmentsInApp_userId_profilesInApp_id"
	}),
}));

export const filesInAppRelations = relations(filesInApp, ({one, many}) => ({
	projectsInApp: one(projectsInApp, {
		fields: [filesInApp.projectId],
		references: [projectsInApp.id]
	}),
	profilesInApp: one(profilesInApp, {
		fields: [filesInApp.uploadedBy],
		references: [profilesInApp.id]
	}),
	fileSharesInApps: many(fileSharesInApp),
}));

export const fileSharesInAppRelations = relations(fileSharesInApp, ({one}) => ({
	filesInApp: one(filesInApp, {
		fields: [fileSharesInApp.fileId],
		references: [filesInApp.id]
	}),
	profilesInApp_sharedBy: one(profilesInApp, {
		fields: [fileSharesInApp.sharedBy],
		references: [profilesInApp.id],
		relationName: "fileSharesInApp_sharedBy_profilesInApp_id"
	}),
	profilesInApp_sharedWith: one(profilesInApp, {
		fields: [fileSharesInApp.sharedWith],
		references: [profilesInApp.id],
		relationName: "fileSharesInApp_sharedWith_profilesInApp_id"
	}),
}));

export const calendarEventsInAppRelations = relations(calendarEventsInApp, ({one, many}) => ({
	profilesInApp: one(profilesInApp, {
		fields: [calendarEventsInApp.createdBy],
		references: [profilesInApp.id]
	}),
	projectsInApp: one(projectsInApp, {
		fields: [calendarEventsInApp.projectId],
		references: [projectsInApp.id]
	}),
	eventAttendeesInApps: many(eventAttendeesInApp),
}));

export const eventAttendeesInAppRelations = relations(eventAttendeesInApp, ({one}) => ({
	calendarEventsInApp: one(calendarEventsInApp, {
		fields: [eventAttendeesInApp.eventId],
		references: [calendarEventsInApp.id]
	}),
	profilesInApp: one(profilesInApp, {
		fields: [eventAttendeesInApp.userId],
		references: [profilesInApp.id]
	}),
}));

export const milestonesInAppRelations = relations(milestonesInApp, ({one, many}) => ({
	projectsInApp: one(projectsInApp, {
		fields: [milestonesInApp.projectId],
		references: [projectsInApp.id]
	}),
	deliverablesInApps: many(deliverablesInApp),
}));

export const deliverablesInAppRelations = relations(deliverablesInApp, ({one}) => ({
	milestonesInApp: one(milestonesInApp, {
		fields: [deliverablesInApp.milestoneId],
		references: [milestonesInApp.id]
	}),
}));

export const documentsInAppRelations = relations(documentsInApp, ({one}) => ({
	profilesInApp: one(profilesInApp, {
		fields: [documentsInApp.createdBy],
		references: [profilesInApp.id]
	}),
	organizationsInApp: one(organizationsInApp, {
		fields: [documentsInApp.organizationId],
		references: [organizationsInApp.id]
	}),
}));

export const estimatesInFinanceRelations = relations(estimatesInFinance, ({one, many}) => ({
	organizationsInApp: one(organizationsInApp, {
		fields: [estimatesInFinance.organizationId],
		references: [organizationsInApp.id]
	}),
	projectsInApp: one(projectsInApp, {
		fields: [estimatesInFinance.projectId],
		references: [projectsInApp.id]
	}),
	estimateItemsInFinances: many(estimateItemsInFinance),
	quotesInFinances: many(quotesInFinance),
	invoicesInFinances: many(invoicesInFinance),
}));

export const estimateItemsInFinanceRelations = relations(estimateItemsInFinance, ({one}) => ({
	estimatesInFinance: one(estimatesInFinance, {
		fields: [estimateItemsInFinance.estimateId],
		references: [estimatesInFinance.id]
	}),
}));

export const quotesInFinanceRelations = relations(quotesInFinance, ({one, many}) => ({
	estimatesInFinance: one(estimatesInFinance, {
		fields: [quotesInFinance.estimateId],
		references: [estimatesInFinance.id]
	}),
	organizationsInApp: one(organizationsInApp, {
		fields: [quotesInFinance.organizationId],
		references: [organizationsInApp.id]
	}),
	projectsInApp: one(projectsInApp, {
		fields: [quotesInFinance.projectId],
		references: [projectsInApp.id]
	}),
	quoteItemsInFinances: many(quoteItemsInFinance),
}));

export const quoteItemsInFinanceRelations = relations(quoteItemsInFinance, ({one}) => ({
	quotesInFinance: one(quotesInFinance, {
		fields: [quoteItemsInFinance.quoteId],
		references: [quotesInFinance.id]
	}),
}));

export const invoicesInFinanceRelations = relations(invoicesInFinance, ({one, many}) => ({
	profilesInApp_clientId: one(profilesInApp, {
		fields: [invoicesInFinance.clientId],
		references: [profilesInApp.id],
		relationName: "invoicesInFinance_clientId_profilesInApp_id"
	}),
	profilesInApp_createdBy: one(profilesInApp, {
		fields: [invoicesInFinance.createdBy],
		references: [profilesInApp.id],
		relationName: "invoicesInFinance_createdBy_profilesInApp_id"
	}),
	invoicesInFinance: one(invoicesInFinance, {
		fields: [invoicesInFinance.duplicatedFromId],
		references: [invoicesInFinance.id],
		relationName: "invoicesInFinance_duplicatedFromId_invoicesInFinance_id"
	}),
	invoicesInFinances: many(invoicesInFinance, {
		relationName: "invoicesInFinance_duplicatedFromId_invoicesInFinance_id"
	}),
	estimatesInFinance: one(estimatesInFinance, {
		fields: [invoicesInFinance.estimateId],
		references: [estimatesInFinance.id]
	}),
	organizationsInApp: one(organizationsInApp, {
		fields: [invoicesInFinance.organizationId],
		references: [organizationsInApp.id]
	}),
	projectsInApp: one(projectsInApp, {
		fields: [invoicesInFinance.projectId],
		references: [projectsInApp.id]
	}),
	invoiceItemsInFinances: many(invoiceItemsInFinance),
	paymentsInFinances: many(paymentsInFinance),
	recurringInvoiceHistoryInFinances: many(recurringInvoiceHistoryInFinance),
}));

export const invoiceItemsInFinanceRelations = relations(invoiceItemsInFinance, ({one}) => ({
	invoicesInFinance: one(invoicesInFinance, {
		fields: [invoiceItemsInFinance.invoiceId],
		references: [invoicesInFinance.id]
	}),
}));

export const paymentsInFinanceRelations = relations(paymentsInFinance, ({one}) => ({
	invoicesInFinance: one(invoicesInFinance, {
		fields: [paymentsInFinance.invoiceId],
		references: [invoicesInFinance.id]
	}),
}));

export const recurringInvoiceTemplatesInFinanceRelations = relations(recurringInvoiceTemplatesInFinance, ({one, many}) => ({
	profilesInApp: one(profilesInApp, {
		fields: [recurringInvoiceTemplatesInFinance.clientId],
		references: [profilesInApp.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [recurringInvoiceTemplatesInFinance.createdBy],
		references: [usersInAuth.id]
	}),
	organizationsInApp: one(organizationsInApp, {
		fields: [recurringInvoiceTemplatesInFinance.organizationId],
		references: [organizationsInApp.id]
	}),
	projectsInApp: one(projectsInApp, {
		fields: [recurringInvoiceTemplatesInFinance.projectId],
		references: [projectsInApp.id]
	}),
	recurringInvoiceHistoryInFinances: many(recurringInvoiceHistoryInFinance),
}));

export const recurringInvoiceHistoryInFinanceRelations = relations(recurringInvoiceHistoryInFinance, ({one}) => ({
	invoicesInFinance: one(invoicesInFinance, {
		fields: [recurringInvoiceHistoryInFinance.invoiceId],
		references: [invoicesInFinance.id]
	}),
	recurringInvoiceTemplatesInFinance: one(recurringInvoiceTemplatesInFinance, {
		fields: [recurringInvoiceHistoryInFinance.templateId],
		references: [recurringInvoiceTemplatesInFinance.id]
	}),
}));

export const messageThreadsInMessagingRelations = relations(messageThreadsInMessaging, ({one, many}) => ({
	profilesInApp: one(profilesInApp, {
		fields: [messageThreadsInMessaging.createdBy],
		references: [profilesInApp.id]
	}),
	projectsInApp: one(projectsInApp, {
		fields: [messageThreadsInMessaging.projectId],
		references: [projectsInApp.id]
	}),
	messagesInMessagings: many(messagesInMessaging),
	threadParticipantsInMessagings: many(threadParticipantsInMessaging),
}));

export const messagesInMessagingRelations = relations(messagesInMessaging, ({one, many}) => ({
	profilesInApp: one(profilesInApp, {
		fields: [messagesInMessaging.senderId],
		references: [profilesInApp.id]
	}),
	messageThreadsInMessaging: one(messageThreadsInMessaging, {
		fields: [messagesInMessaging.threadId],
		references: [messageThreadsInMessaging.id]
	}),
	messageRecipientsInMessagings: many(messageRecipientsInMessaging),
}));

export const messageRecipientsInMessagingRelations = relations(messageRecipientsInMessaging, ({one}) => ({
	messagesInMessaging: one(messagesInMessaging, {
		fields: [messageRecipientsInMessaging.messageId],
		references: [messagesInMessaging.id]
	}),
	profilesInApp: one(profilesInApp, {
		fields: [messageRecipientsInMessaging.userId],
		references: [profilesInApp.id]
	}),
}));

export const threadParticipantsInMessagingRelations = relations(threadParticipantsInMessaging, ({one}) => ({
	messageThreadsInMessaging: one(messageThreadsInMessaging, {
		fields: [threadParticipantsInMessaging.threadId],
		references: [messageThreadsInMessaging.id]
	}),
	profilesInApp: one(profilesInApp, {
		fields: [threadParticipantsInMessaging.userId],
		references: [profilesInApp.id]
	}),
}));

export const auditLogsInAuditRelations = relations(auditLogsInAudit, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [auditLogsInAudit.userId],
		references: [usersInAuth.id]
	}),
}));
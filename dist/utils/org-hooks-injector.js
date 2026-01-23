import { emitEvent } from "./event-ingestion.js";
/**
 * Wraps organization hooks to automatically emit events
 * This should be used in the organization plugin's organizationHooks option
 */
export function createOrganizationHooksWithEvents(eventsConfig, userHooks) {
    if (!eventsConfig?.enabled) {
        return userHooks || {};
    }
    const capturedConfig = eventsConfig;
    const getRequestInfo = () => {
        return { headers: {}, ip: undefined };
    };
    return {
        // Organization hooks
        beforeCreateOrganization: userHooks?.beforeCreateOrganization
            ? async (data) => {
                const result = await userHooks.beforeCreateOrganization(data);
                return result;
            }
            : undefined,
        afterCreateOrganization: userHooks?.afterCreateOrganization
            ? async (data) => {
                await userHooks.afterCreateOrganization(data);
                emitEvent("organization.created", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user.id,
                    metadata: {
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        email: data.user.email,
                        name: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("organization.created", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user.id,
                    metadata: {
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        email: data.user.email,
                        name: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        beforeUpdateOrganization: userHooks?.beforeUpdateOrganization
            ? async (data) => {
                const result = await userHooks.beforeUpdateOrganization(data);
                return result;
            }
            : undefined,
        afterUpdateOrganization: userHooks?.afterUpdateOrganization
            ? async (data) => {
                await userHooks.afterUpdateOrganization?.(data);
                if (data.organization) {
                    emitEvent("organization.updated", {
                        status: "success",
                        organizationId: data.organization.id,
                        userId: data.user.id,
                        metadata: {
                            organizationName: data.organization.name,
                            organizationSlug: data.organization.slug,
                            email: data.user.email,
                            name: data.user.name,
                        },
                        request: getRequestInfo(),
                    }, capturedConfig).catch(() => { });
                }
            }
            : async (data) => {
                if (data.organization) {
                    emitEvent("organization.updated", {
                        status: "success",
                        organizationId: data.organization.id,
                        userId: data.user.id,
                        metadata: {
                            organizationName: data.organization.name,
                            organizationSlug: data.organization.slug,
                            email: data.user.email,
                            name: data.user.name,
                        },
                        request: getRequestInfo(),
                    }, capturedConfig).catch(() => { });
                }
            },
        beforeDeleteOrganization: userHooks?.beforeDeleteOrganization
            ? async (data) => {
                await userHooks.beforeDeleteOrganization(data);
            }
            : undefined,
        afterDeleteOrganization: userHooks?.afterDeleteOrganization
            ? async (data) => {
                await userHooks.afterDeleteOrganization?.(data);
                emitEvent("organization.deleted", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user.id,
                    metadata: {
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        email: data.user.email,
                        name: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("organization.deleted", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user.id,
                    metadata: {
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        email: data.user.email,
                        name: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        // Member hooks
        beforeAddMember: userHooks?.beforeAddMember
            ? async (data) => {
                const result = await userHooks.beforeAddMember(data);
                return result;
            }
            : undefined,
        afterAddMember: userHooks?.afterAddMember
            ? async (data) => {
                await userHooks.afterAddMember?.(data);
                emitEvent("member.added", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.member.userId,
                    metadata: {
                        memberId: data.member.id,
                        role: data.member.role,
                        addedByUserId: data.user.id,
                        addedByEmail: data.user.email,
                        addedByName: data.user.name,
                        memberEmail: data.user.email,
                        memberName: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("member.added", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.member.userId,
                    metadata: {
                        memberId: data.member.id,
                        role: data.member.role,
                        addedByUserId: data.user.id,
                        addedByEmail: data.user.email,
                        addedByName: data.user.name,
                        memberEmail: data.user.email,
                        memberName: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        beforeRemoveMember: userHooks?.beforeRemoveMember
            ? async (data) => {
                await userHooks.beforeRemoveMember(data);
            }
            : undefined,
        afterRemoveMember: userHooks?.afterRemoveMember
            ? async (data) => {
                await userHooks.afterRemoveMember?.(data);
                emitEvent("member.removed", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.member.userId,
                    metadata: {
                        memberId: data.member.id,
                        removedByUserId: data.user.id,
                        removedByEmail: data.user.email,
                        removedByName: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("member.removed", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.member.userId,
                    metadata: {
                        memberId: data.member.id,
                        removedByUserId: data.user.id,
                        removedByEmail: data.user.email,
                        removedByName: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        beforeUpdateMemberRole: userHooks?.beforeUpdateMemberRole
            ? async (data) => {
                const result = await userHooks.beforeUpdateMemberRole(data);
                return result;
            }
            : undefined,
        afterUpdateMemberRole: userHooks?.afterUpdateMemberRole
            ? async (data) => {
                await userHooks.afterUpdateMemberRole?.(data);
                emitEvent("member.role_changed", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.member.userId,
                    metadata: {
                        memberId: data.member.id,
                        oldRole: data.previousRole,
                        newRole: data.member.role,
                        changedByUserId: data.user.id,
                        changedByEmail: data.user.email,
                        changedByName: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("member.role_changed", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.member.userId,
                    metadata: {
                        memberId: data.member.id,
                        oldRole: data.previousRole,
                        newRole: data.member.role,
                        changedByUserId: data.user.id,
                        changedByEmail: data.user.email,
                        changedByName: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        // Team hooks
        beforeCreateTeam: userHooks?.beforeCreateTeam
            ? async (data) => {
                const result = await userHooks.beforeCreateTeam(data);
                return result;
            }
            : undefined,
        afterCreateTeam: userHooks?.afterCreateTeam
            ? async (data) => {
                await userHooks.afterCreateTeam?.(data);
                emitEvent("team.created", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user?.id,
                    metadata: {
                        teamId: data.team.id,
                        teamName: data.team.name,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        email: data.user?.email,
                        name: data.user?.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("team.created", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user?.id,
                    metadata: {
                        teamId: data.team.id,
                        teamName: data.team.name,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        email: data.user?.email,
                        name: data.user?.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        beforeUpdateTeam: userHooks?.beforeUpdateTeam
            ? async (data) => {
                const result = await userHooks.beforeUpdateTeam(data);
                return result;
            }
            : undefined,
        afterUpdateTeam: userHooks?.afterUpdateTeam
            ? async (data) => {
                await userHooks.afterUpdateTeam?.(data);
                if (data.team) {
                    emitEvent("team.updated", {
                        status: "success",
                        organizationId: data.organization.id,
                        userId: data.user.id,
                        metadata: {
                            teamId: data.team.id,
                            teamName: data.team.name,
                            organizationName: data.organization.name,
                            organizationSlug: data.organization.slug,
                            email: data.user.email,
                            name: data.user.name,
                        },
                        request: getRequestInfo(),
                    }, capturedConfig).catch(() => { });
                }
            }
            : async (data) => {
                if (data.team) {
                    emitEvent("team.updated", {
                        status: "success",
                        organizationId: data.organization.id,
                        userId: data.user.id,
                        metadata: {
                            teamId: data.team.id,
                            teamName: data.team.name,
                            organizationName: data.organization.name,
                            organizationSlug: data.organization.slug,
                            email: data.user.email,
                            name: data.user.name,
                        },
                        request: getRequestInfo(),
                    }, capturedConfig).catch(() => { });
                }
            },
        beforeDeleteTeam: userHooks?.beforeDeleteTeam
            ? async (data) => {
                await userHooks.beforeDeleteTeam(data);
            }
            : undefined,
        afterDeleteTeam: userHooks?.afterDeleteTeam
            ? async (data) => {
                await userHooks.afterDeleteTeam?.(data);
                emitEvent("team.deleted", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user?.id,
                    metadata: {
                        teamId: data.team.id,
                        teamName: data.team.name,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        email: data.user?.email,
                        name: data.user?.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("team.deleted", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user?.id,
                    metadata: {
                        teamId: data.team.id,
                        teamName: data.team.name,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        email: data.user?.email,
                        name: data.user?.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        // Team member hooks
        beforeAddTeamMember: userHooks?.beforeAddTeamMember
            ? async (data) => {
                const result = await userHooks.beforeAddTeamMember(data);
                return result;
            }
            : undefined,
        afterAddTeamMember: userHooks?.afterAddTeamMember
            ? async (data) => {
                await userHooks.afterAddTeamMember?.(data);
                emitEvent("team.member.added", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.teamMember.userId,
                    metadata: {
                        teamMemberId: data.teamMember.id,
                        teamId: data.team.id,
                        teamName: data.team.name,
                        organizationName: data.organization.name,
                        memberEmail: data.user.email,
                        memberName: data.user.name,
                        addedByUserId: data.user.id,
                        addedByEmail: data.user.email,
                        addedByName: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("team.member.added", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.teamMember.userId,
                    metadata: {
                        teamMemberId: data.teamMember.id,
                        teamId: data.team.id,
                        teamName: data.team.name,
                        organizationName: data.organization.name,
                        memberEmail: data.user.email,
                        memberName: data.user.name,
                        addedUserId: data.user.id,
                        addedEmail: data.user.email,
                        addedName: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        beforeRemoveTeamMember: userHooks?.beforeRemoveTeamMember
            ? async (data) => {
                await userHooks.beforeRemoveTeamMember(data);
            }
            : undefined,
        afterRemoveTeamMember: userHooks?.afterRemoveTeamMember
            ? async (data) => {
                await userHooks.afterRemoveTeamMember?.(data);
                emitEvent("team.member.removed", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.teamMember.userId,
                    metadata: {
                        teamMemberId: data.teamMember.id,
                        teamId: data.team.id,
                        teamName: data.team.name,
                        organizationName: data.organization.name,
                        removedUserId: data.user.id,
                        removedEmail: data.user.email,
                        removedName: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("team.member.removed", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.teamMember.userId,
                    metadata: {
                        teamMemberId: data.teamMember.id,
                        teamId: data.team.id,
                        teamName: data.team.name,
                        organizationName: data.organization.name,
                        removedUserId: data.user.id,
                        removedEmail: data.user.email,
                        removedName: data.user.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        // Invitation hooks
        beforeCreateInvitation: userHooks?.beforeCreateInvitation
            ? async (data) => {
                const result = await userHooks.beforeCreateInvitation(data);
                return result;
            }
            : undefined,
        afterCreateInvitation: userHooks?.afterCreateInvitation
            ? async (data) => {
                await userHooks.afterCreateInvitation?.(data);
                emitEvent("invitation.created", {
                    status: "success",
                    organizationId: data.organization.id,
                    metadata: {
                        invitationId: data.invitation.id,
                        email: data.invitation.email,
                        role: data.invitation.role,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        inviterEmail: data.inviter.email,
                        inviterName: data.inviter.name,
                        inviterId: data.inviter.id,
                        teamId: data.invitation.teamId,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("invitation.created", {
                    status: "success",
                    organizationId: data.organization.id,
                    metadata: {
                        invitationId: data.invitation.id,
                        email: data.invitation.email,
                        role: data.invitation.role,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        inviterEmail: data.inviter.email,
                        inviterName: data.inviter.name,
                        inviterId: data.inviter.id,
                        teamId: data.invitation.teamId,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        beforeAcceptInvitation: userHooks?.beforeAcceptInvitation
            ? async (data) => {
                await userHooks.beforeAcceptInvitation(data);
            }
            : undefined,
        afterAcceptInvitation: userHooks?.afterAcceptInvitation
            ? async (data) => {
                await userHooks.afterAcceptInvitation?.(data);
                emitEvent("invitation.accepted", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user.id,
                    metadata: {
                        invitationId: data.invitation.id,
                        email: data.user.email,
                        name: data.user.name,
                        role: data.member.role,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("invitation.accepted", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user.id,
                    metadata: {
                        invitationId: data.invitation.id,
                        email: data.user.email,
                        name: data.user.name,
                        role: data.member.role,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        beforeRejectInvitation: userHooks?.beforeRejectInvitation
            ? async (data) => {
                await userHooks.beforeRejectInvitation(data);
            }
            : undefined,
        afterRejectInvitation: userHooks?.afterRejectInvitation
            ? async (data) => {
                await userHooks.afterRejectInvitation?.(data);
                emitEvent("invitation.rejected", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user.id,
                    metadata: {
                        invitationId: data.invitation.id,
                        email: data.user.email,
                        name: data.user.name,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("invitation.rejected", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.user.id,
                    metadata: {
                        invitationId: data.invitation.id,
                        email: data.user.email,
                        name: data.user.name,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
        beforeCancelInvitation: userHooks?.beforeCancelInvitation
            ? async (data) => {
                await userHooks.beforeCancelInvitation(data);
            }
            : undefined,
        afterCancelInvitation: userHooks?.afterCancelInvitation
            ? async (data) => {
                await userHooks.afterCancelInvitation?.(data);
                emitEvent("invitation.cancelled", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.cancelledBy.id,
                    metadata: {
                        invitationId: data.invitation.id,
                        email: data.invitation.email,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        cancelledByEmail: data.cancelledBy.email,
                        cancelledByName: data.cancelledBy.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            }
            : async (data) => {
                emitEvent("invitation.cancelled", {
                    status: "success",
                    organizationId: data.organization.id,
                    userId: data.cancelledBy.id,
                    metadata: {
                        invitationId: data.invitation.id,
                        email: data.invitation.email,
                        organizationName: data.organization.name,
                        organizationSlug: data.organization.slug,
                        cancelledByEmail: data.cancelledBy.email,
                        cancelledByName: data.cancelledBy.name,
                    },
                    request: getRequestInfo(),
                }, capturedConfig).catch(() => { });
            },
    };
}
/**
 * Automatically wraps organization plugin hooks to emit events
 * This should be called during Better Auth initialization
 */
export function wrapOrganizationPluginHooks(auth, eventsConfig) {
    if (!auth || !eventsConfig?.enabled) {
        return;
    }
    try {
        const plugins = auth.options?.plugins || [];
        const orgPlugin = plugins.find((p) => p?.id === "organization");
        if (!orgPlugin) {
            return;
        }
        const existingHooks = orgPlugin.options?.organizationHooks ||
            orgPlugin.organizationHooks ||
            (orgPlugin.options && orgPlugin.options.organizationHooks) ||
            {};
        const wrappedHooks = createOrganizationHooksWithEvents(eventsConfig, existingHooks);
        if (!orgPlugin.options) {
            orgPlugin.options = {};
        }
        orgPlugin.options.organizationHooks = wrappedHooks;
        orgPlugin.organizationHooks = wrappedHooks;
    }
    catch (error) {
        console.error("[Organization Hooks] Failed to wrap hooks:", error);
    }
}
//# sourceMappingURL=org-hooks-injector.js.map
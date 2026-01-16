import type { StudioConfig } from '../types/handler.js';
import { emitEvent } from './event-ingestion.js';

/**
 * Wraps organization hooks to automatically emit events
 * This should be used in the organization plugin's organizationHooks option
 */
export function createOrganizationHooksWithEvents(
  eventsConfig: StudioConfig['events'],
  userHooks?: {
    beforeCreateOrganization?: any;
    afterCreateOrganization?: any;
    beforeUpdateOrganization?: any;
    afterUpdateOrganization?: any;
    beforeDeleteOrganization?: any;
    afterDeleteOrganization?: any;
    beforeAddMember?: any;
    afterAddMember?: any;
    beforeRemoveMember?: any;
    afterRemoveMember?: any;
    beforeUpdateMemberRole?: any;
    afterUpdateMemberRole?: any;
    beforeCreateTeam?: any;
    afterCreateTeam?: any;
    beforeUpdateTeam?: any;
    afterUpdateTeam?: any;
    beforeDeleteTeam?: any;
    afterDeleteTeam?: any;
    beforeAddTeamMember?: any;
    afterAddTeamMember?: any;
    beforeRemoveTeamMember?: any;
    afterRemoveTeamMember?: any;
    beforeCreateInvitation?: any;
    afterCreateInvitation?: any;
    beforeAcceptInvitation?: any;
    afterAcceptInvitation?: any;
    beforeRejectInvitation?: any;
    afterRejectInvitation?: any;
    beforeCancelInvitation?: any;
    afterCancelInvitation?: any;
  }
) {
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
      ? async (data: any) => {
          const result = await userHooks.beforeCreateOrganization(data);
          return result;
        }
      : undefined,

    afterCreateOrganization: userHooks?.afterCreateOrganization
      ? async (data: any) => {
          await userHooks.afterCreateOrganization(data);
          // Emit event
          emitEvent(
            'organization.created',
            {
              status: 'success',
              organizationId: data.organization.id,
              userId: data.user.id,
              metadata: {
                organizationName: data.organization.name,
                organizationSlug: data.organization.slug,
                email: data.user.email,
                name: data.user.name,
              },
              request: getRequestInfo(),
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'organization.created',
            {
              status: 'success',
              organizationId: data.organization.id,
              userId: data.user.id,
              metadata: {
                organizationName: data.organization.name,
                organizationSlug: data.organization.slug,
                email: data.user.email,
                name: data.user.name,
              },
              request: getRequestInfo(),
            },
            capturedConfig
          ).catch(() => {});
        },

    beforeUpdateOrganization: userHooks?.beforeUpdateOrganization
      ? async (data: any) => {
          const result = await userHooks.beforeUpdateOrganization(data);
          return result;
        }
      : undefined,

    afterUpdateOrganization: userHooks?.afterUpdateOrganization
      ? async (data: any) => {
          await userHooks.afterUpdateOrganization?.(data);
          // Emit event
          if (data.organization) {
            emitEvent(
              'organization.updated',
              {
                status: 'success',
                organizationId: data.organization.id,
                userId: data.user.id,
                metadata: {
                  organizationName: data.organization.name,
                  organizationSlug: data.organization.slug,
                  email: data.user.email,
                  name: data.user.name,
                },
                request: getRequestInfo(),
              },
              capturedConfig
            ).catch(() => {});
          }
        }
      : async (data: any) => {
          // Emit event even if no user hook
          if (data.organization) {
            emitEvent(
              'organization.updated',
              {
                status: 'success',
                organizationId: data.organization.id,
                userId: data.user.id,
                metadata: {
                  organizationName: data.organization.name,
                  organizationSlug: data.organization.slug,
                  email: data.user.email,
                  name: data.user.name,
                },
                request: getRequestInfo(),
              },
              capturedConfig
            ).catch(() => {});
          }
        },

    beforeDeleteOrganization: userHooks?.beforeDeleteOrganization
      ? async (data: any) => {
          await userHooks.beforeDeleteOrganization(data);
        }
      : undefined,

    afterDeleteOrganization: userHooks?.afterDeleteOrganization
      ? async (data: any) => {
          await userHooks.afterDeleteOrganization?.(data);
          // Emit event
          emitEvent(
            'organization.deleted',
            {
              status: 'success',
              organizationId: data.organization.id,
              userId: data.user.id,
              metadata: {
                organizationName: data.organization.name,
                organizationSlug: data.organization.slug,
                email: data.user.email,
                name: data.user.name,
              },
              request: getRequestInfo(),
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'organization.deleted',
            {
              status: 'success',
              organizationId: data.organization.id,
              userId: data.user.id,
              metadata: {
                organizationName: data.organization.name,
                organizationSlug: data.organization.slug,
                email: data.user.email,
                name: data.user.name,
              },
              request: getRequestInfo(),
            },
            capturedConfig
          ).catch(() => {});
        },

    // Member hooks
    beforeAddMember: userHooks?.beforeAddMember
      ? async (data: any) => {
          const result = await userHooks.beforeAddMember(data);
          return result;
        }
      : undefined,

    afterAddMember: userHooks?.afterAddMember
      ? async (data: any) => {
          await userHooks.afterAddMember?.(data);
          // Emit event
          emitEvent(
            'member.added',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'member.added',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        },

    beforeRemoveMember: userHooks?.beforeRemoveMember
      ? async (data: any) => {
          await userHooks.beforeRemoveMember(data);
        }
      : undefined,

    afterRemoveMember: userHooks?.afterRemoveMember
      ? async (data: any) => {
          await userHooks.afterRemoveMember?.(data);
          // Emit event
          emitEvent(
            'member.removed',
            {
              status: 'success',
              organizationId: data.organization.id,
              userId: data.member.userId,
              metadata: {
                memberId: data.member.id,
                removedByUserId: data.user.id,
                removedByEmail: data.user.email,
                removedByName: data.user.name,
              },
              request: getRequestInfo(),
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'member.removed',
            {
              status: 'success',
              organizationId: data.organization.id,
              userId: data.member.userId,
              metadata: {
                memberId: data.member.id,
                removedByUserId: data.user.id,
                removedByEmail: data.user.email,
                removedByName: data.user.name,
              },
              request: getRequestInfo(),
            },
            capturedConfig
          ).catch(() => {});
        },

    beforeUpdateMemberRole: userHooks?.beforeUpdateMemberRole
      ? async (data: any) => {
          const result = await userHooks.beforeUpdateMemberRole(data);
          return result;
        }
      : undefined,

    afterUpdateMemberRole: userHooks?.afterUpdateMemberRole
      ? async (data: any) => {
          await userHooks.afterUpdateMemberRole?.(data);
          // Emit event
          emitEvent(
            'member.role_changed',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'member.role_changed',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        },

    // Team hooks
    beforeCreateTeam: userHooks?.beforeCreateTeam
      ? async (data: any) => {
          const result = await userHooks.beforeCreateTeam(data);
          return result;
        }
      : undefined,

    afterCreateTeam: userHooks?.afterCreateTeam
      ? async (data: any) => {
          await userHooks.afterCreateTeam?.(data);
          // Emit event
          emitEvent(
            'team.created',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'team.created',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        },

    beforeUpdateTeam: userHooks?.beforeUpdateTeam
      ? async (data: any) => {
          const result = await userHooks.beforeUpdateTeam(data);
          return result;
        }
      : undefined,

    afterUpdateTeam: userHooks?.afterUpdateTeam
      ? async (data: any) => {
          await userHooks.afterUpdateTeam?.(data);
          // Emit event
          if (data.team) {
            emitEvent(
              'team.updated',
              {
                status: 'success',
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
              },
              capturedConfig
            ).catch(() => {});
          }
        }
      : async (data: any) => {
          // Emit event even if no user hook
          if (data.team) {
            emitEvent(
              'team.updated',
              {
                status: 'success',
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
              },
              capturedConfig
            ).catch(() => {});
          }
        },

    beforeDeleteTeam: userHooks?.beforeDeleteTeam
      ? async (data: any) => {
          await userHooks.beforeDeleteTeam(data);
        }
      : undefined,

    afterDeleteTeam: userHooks?.afterDeleteTeam
      ? async (data: any) => {
          await userHooks.afterDeleteTeam?.(data);
          // Emit event
          emitEvent(
            'team.deleted',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'team.deleted',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        },

    // Team member hooks
    beforeAddTeamMember: userHooks?.beforeAddTeamMember
      ? async (data: any) => {
          const result = await userHooks.beforeAddTeamMember(data);
          return result;
        }
      : undefined,

    afterAddTeamMember: userHooks?.afterAddTeamMember
      ? async (data: any) => {
          await userHooks.afterAddTeamMember?.(data);
          // Emit event
          emitEvent(
            'team.member.added',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'team.member.added',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        },

    beforeRemoveTeamMember: userHooks?.beforeRemoveTeamMember
      ? async (data: any) => {
          await userHooks.beforeRemoveTeamMember(data);
        }
      : undefined,

    afterRemoveTeamMember: userHooks?.afterRemoveTeamMember
      ? async (data: any) => {
          await userHooks.afterRemoveTeamMember?.(data);
          // Emit event
          emitEvent(
            'team.member.removed',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'team.member.removed',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        },

    // Invitation hooks
    beforeCreateInvitation: userHooks?.beforeCreateInvitation
      ? async (data: any) => {
          const result = await userHooks.beforeCreateInvitation(data);
          return result;
        }
      : undefined,

    afterCreateInvitation: userHooks?.afterCreateInvitation
      ? async (data: any) => {
          await userHooks.afterCreateInvitation?.(data);
          // Emit event
          emitEvent(
            'invitation.created',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'invitation.created',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        },

    beforeAcceptInvitation: userHooks?.beforeAcceptInvitation
      ? async (data: any) => {
          await userHooks.beforeAcceptInvitation(data);
        }
      : undefined,

    afterAcceptInvitation: userHooks?.afterAcceptInvitation
      ? async (data: any) => {
          await userHooks.afterAcceptInvitation?.(data);
          // Emit event
          emitEvent(
            'invitation.accepted',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'invitation.accepted',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        },

    beforeRejectInvitation: userHooks?.beforeRejectInvitation
      ? async (data: any) => {
          await userHooks.beforeRejectInvitation(data);
        }
      : undefined,

    afterRejectInvitation: userHooks?.afterRejectInvitation
      ? async (data: any) => {
          await userHooks.afterRejectInvitation?.(data);
          // Emit event
          emitEvent(
            'invitation.rejected',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'invitation.rejected',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        },

    beforeCancelInvitation: userHooks?.beforeCancelInvitation
      ? async (data: any) => {
          await userHooks.beforeCancelInvitation(data);
        }
      : undefined,

    afterCancelInvitation: userHooks?.afterCancelInvitation
      ? async (data: any) => {
          await userHooks.afterCancelInvitation?.(data);
          // Emit event
          emitEvent(
            'invitation.cancelled',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        }
      : async (data: any) => {
          // Emit event even if no user hook
          emitEvent(
            'invitation.cancelled',
            {
              status: 'success',
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
            },
            capturedConfig
          ).catch(() => {});
        },
  };
}

/**
 * Automatically wraps organization plugin hooks to emit events
 * This should be called during Better Auth initialization
 */
export function wrapOrganizationPluginHooks(auth: any, eventsConfig: StudioConfig['events']): void {
  if (!auth || !eventsConfig?.enabled) {
    return;
  }

  try {
    const plugins = auth.options?.plugins || [];
    const orgPlugin = plugins.find((p: any) => p?.id === 'organization');

    if (!orgPlugin) {
      return;
    }

    const existingHooks =
      orgPlugin.options?.organizationHooks ||
      orgPlugin.organizationHooks ||
      (orgPlugin.options && (orgPlugin.options as any).organizationHooks) ||
      {};

    const wrappedHooks = createOrganizationHooksWithEvents(eventsConfig, existingHooks);

    if (!orgPlugin.options) {
      orgPlugin.options = {};
    }
    orgPlugin.options.organizationHooks = wrappedHooks;
    orgPlugin.organizationHooks = wrappedHooks;
  } catch (error) {
    console.error('[Organization Hooks] Failed to wrap hooks:', error);
  }
}

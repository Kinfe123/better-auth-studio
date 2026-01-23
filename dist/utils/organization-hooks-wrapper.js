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
  // Helper to extract request info
  // Note: Organization hooks don't receive request directly, so we return empty info
  // The request info will be captured by the main hook injector for endpoint-based operations
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
          // Emit event
          emitEvent(
            "organization.created",
            {
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
            },
            capturedConfig,
          ).catch(() => {});
        }
      : async (data) => {
          // Emit event even if no user hook
          emitEvent(
            "organization.created",
            {
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
            },
            capturedConfig,
          ).catch(() => {});
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
          // Emit event
          if (data.organization) {
            emitEvent(
              "organization.updated",
              {
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
              },
              capturedConfig,
            ).catch(() => {});
          }
        }
      : async (data) => {
          // Emit event even if no user hook
          if (data.organization) {
            emitEvent(
              "organization.updated",
              {
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
              },
              capturedConfig,
            ).catch(() => {});
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
          // Emit event
          emitEvent(
            "organization.deleted",
            {
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
            },
            capturedConfig,
          ).catch(() => {});
        }
      : async (data) => {
          // Emit event even if no user hook
          emitEvent(
            "organization.deleted",
            {
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
            },
            capturedConfig,
          ).catch(() => {});
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
          // Emit event
          emitEvent(
            "member.added",
            {
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
            },
            capturedConfig,
          ).catch(() => {});
        }
      : async (data) => {
          // Emit event even if no user hook
          emitEvent(
            "member.added",
            {
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
            },
            capturedConfig,
          ).catch(() => {});
        },
    beforeRemoveMember: userHooks?.beforeRemoveMember
      ? async (data) => {
          await userHooks.beforeRemoveMember(data);
        }
      : undefined,
    afterRemoveMember: userHooks?.afterRemoveMember
      ? async (data) => {
          await userHooks.afterRemoveMember?.(data);
          // Emit event
          emitEvent(
            "member.removed",
            {
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
            },
            capturedConfig,
          ).catch(() => {});
        }
      : async (data) => {
          // Emit event even if no user hook
          emitEvent(
            "member.removed",
            {
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
            },
            capturedConfig,
          ).catch(() => {});
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
          // Emit event
          emitEvent(
            "member.role_changed",
            {
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
            },
            capturedConfig,
          ).catch(() => {});
        }
      : async (data) => {
          // Emit event even if no user hook
          emitEvent(
            "member.role_changed",
            {
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
            },
            capturedConfig,
          ).catch(() => {});
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
    // Find the organization plugin
    const plugins = auth.options?.plugins || [];
    const orgPlugin = plugins.find((p) => p?.id === "organization");
    if (!orgPlugin) {
      return; // Organization plugin not found
    }
    // Get existing organization hooks from plugin options
    // Better Auth may store hooks in different locations depending on version
    const existingHooks =
      orgPlugin.options?.organizationHooks ||
      orgPlugin.organizationHooks ||
      (orgPlugin.options && orgPlugin.options.organizationHooks) ||
      {};
    // Wrap the hooks
    const wrappedHooks = createOrganizationHooksWithEvents(eventsConfig, existingHooks);
    // Update the plugin options in all possible locations
    if (!orgPlugin.options) {
      orgPlugin.options = {};
    }
    orgPlugin.options.organizationHooks = wrappedHooks;
    // Also set directly on plugin for compatibility
    orgPlugin.organizationHooks = wrappedHooks;
  } catch (error) {
    console.error("[Organization Hooks] Failed to wrap hooks:", error);
  }
}
//# sourceMappingURL=organization-hooks-wrapper.js.map

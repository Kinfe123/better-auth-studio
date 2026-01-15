import type { StudioConfig } from '../types/handler.js';
/**
 * Wraps organization hooks to automatically emit events
 * This should be used in the organization plugin's organizationHooks option
 */
export declare function createOrganizationHooksWithEvents(eventsConfig: StudioConfig['events'], userHooks?: {
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
}): {
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
};
/**
 * Automatically wraps organization plugin hooks to emit events
 * This should be called during Better Auth initialization
 */
export declare function wrapOrganizationPluginHooks(auth: any, eventsConfig: StudioConfig['events']): void;
//# sourceMappingURL=organization-hooks-wrapper.d.ts.map
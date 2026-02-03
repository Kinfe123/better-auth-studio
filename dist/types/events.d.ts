export type AuthEventType = "user.joined" | "user.logged_in" | "user.updated" | "user.logged_out" | "user.password_changed" | "user.email_verified" | "user.banned" | "user.unbanned" | "user.deleted" | "user.delete_verification_requested" | "organization.created" | "organization.deleted" | "organization.updated" | "member.added" | "member.removed" | "member.role_changed" | "session.created" | "login.failed" | "password.reset_requested" | "password.reset_completed" | "password.reset_requested_otp" | "password.reset_completed_otp" | "oauth.linked" | "oauth.unlinked" | "oauth.sign_in" | "team.created" | "team.updated" | "team.deleted" | "team.member.added" | "team.member.removed" | "invitation.created" | "invitation.accepted" | "invitation.rejected" | "invitation.cancelled" | "phone_number.otp_requested" | "phone_number.verification";
export interface AuthEvent {
    id: string;
    type: AuthEventType;
    timestamp: Date;
    status: "success" | "failed";
    userId?: string;
    sessionId?: string;
    organizationId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    source: "app" | "api";
    display?: {
        message: string;
        severity?: "info" | "success" | "warning" | "failed";
    };
}
export interface EventQueryOptions {
    limit?: number;
    after?: string;
    sort?: "asc" | "desc";
    type?: string;
    userId?: string;
    since?: Date;
}
export interface EventQueryResult {
    events: AuthEvent[];
    hasMore: boolean;
    nextCursor: string | null;
}
export interface EventIngestionProvider {
    ingest(event: AuthEvent): Promise<void>;
    ingestBatch?(events: AuthEvent[]): Promise<void>;
    query?(options: EventQueryOptions): Promise<EventQueryResult>;
    healthCheck?(): Promise<boolean>;
    shutdown?(): Promise<void>;
}
export declare const EVENT_TEMPLATES: Record<AuthEventType, (event: AuthEvent) => string>;
export declare function getEventSeverity(event: AuthEvent | {
    type: AuthEventType;
    status?: "success" | "failed";
}, status?: "success" | "failed"): "info" | "success" | "warning" | "failed";
//# sourceMappingURL=events.d.ts.map
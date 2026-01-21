export type AuthEventType =
  | 'user.joined'
  | 'user.logged_in'
  | 'user.updated'
  | 'user.logged_out'
  | 'user.password_changed'
  | 'user.email_verified'
  | 'user.banned'
  | 'user.unbanned'
  | 'user.deleted'
  | 'user.delete_verification_requested'
  | 'organization.created'
  | 'organization.deleted'
  | 'organization.updated'
  | 'member.added'
  | 'member.removed'
  | 'member.role_changed'
  | 'session.created'
  | 'login.failed'
  | 'password.reset_requested'
  | 'password.reset_completed'
  | 'password.reset_requested_otp'
  | 'password.reset_completed_otp'
  | 'oauth.linked'
  | 'oauth.unlinked'
  | 'oauth.sign_in'
  | 'team.created'
  | 'team.updated'
  | 'team.deleted'
  | 'team.member.added'
  | 'team.member.removed'
  | 'invitation.created'
  | 'invitation.accepted'
  | 'invitation.rejected'
  | 'invitation.cancelled';

export interface AuthEvent {
  id: string;
  type: AuthEventType;
  timestamp: Date;
  status: 'success' | 'failed';
  userId?: string;
  sessionId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  source: 'app' | 'api';
  display?: {
    message: string;
    severity?: 'info' | 'success' | 'warning' | 'failed';
  };
}

export interface EventQueryOptions {
  limit?: number;
  after?: string; // Cursor for pagination
  sort?: 'asc' | 'desc'; // 'desc' = newest first (default), 'asc' = oldest first
  type?: string;
  userId?: string;
  since?: Date; // Filter events since this timestamp
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

export const EVENT_TEMPLATES: Record<AuthEventType, (event: AuthEvent) => string> = {
  'user.joined': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `${name} failed to join`;
    }
    return `${name} joined!`;
  },
  'user.updated': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    return `${name} updated their profile`;
  },
  'user.logged_in': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `${name} failed to login`;
    }
    return `${name} logged in`;
  },
  'user.logged_out': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `${name} failed to logout`;
    }
    return `${name} logged out`;
  },
  'user.password_changed': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `${name} failed to change password`;
    }
    return `${name} changed password`;
  },
  'user.email_verified': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `${name} failed to verify email`;
    }
    return `${name} verified email`;
  },
  'user.banned': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `${name} failed to ban`;
    }
    return `${name} was banned`;
  },
  'user.unbanned': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `${name} failed to unban`;
    }
    return `${name} was unbanned`;
  },
  'user.deleted': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    return `${name} was deleted`;
  },
  'user.delete_verification_requested': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to send delete verification for "${name}"`;
    }
    return `Delete verification requested for ${name}`;
  },
  'organization.created': (event) => {
    const orgName = event.metadata?.organizationName || 'Organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to create organization "${orgName}"`;
    }
    return `New organization "${orgName}" created by ${event.metadata?.name.split(' ')[0]}`;
  },
  'organization.deleted': (event) => {
    const orgName = event.metadata?.organizationName || 'Organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to delete organization "${orgName}"`;
    }
    return `Organization "${orgName}" deleted`;
  },
  'organization.updated': (event) => {
    const orgName = event.metadata?.organizationName || 'Organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to update organization "${orgName}"`;
    }
    return `Organization "${orgName}" updated`;
  },
  'member.added': (event) => {
    const memberName = event.metadata?.addedByName || event.metadata?.addedByEmail || 'Member';
    const orgName = event.metadata?.organizationName || 'organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to add member "${memberName}" to "${orgName}"`;
    }
    return `${memberName} added to ${orgName}`;
  },
  'member.removed': (event) => {
    const memberName = event.metadata?.removedByName || event.metadata?.removedByEmail || 'Member';
    const orgName = event.metadata?.organizationName || 'organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to remove member "${memberName}" from "${orgName}"`;
    }
    return `${memberName} removed from ${orgName}`;
  },
  'member.role_changed': (event) => {
    const memberName = event.metadata?.changedByName || event.metadata?.changedByEmail || 'Member';
    const oldRole = event.metadata?.oldRole || 'member';
    const newRole = event.metadata?.newRole || 'member';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to change role of "${memberName}" from "${oldRole}" to "${newRole}"`;
    }
    return `${memberName} role changed from ${oldRole} to ${newRole}`;
  },
  'session.created': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to create session for "${name}"`;
    }
    return `New session created for ${name}`;
  },
  'login.failed': (event) => {
    const email = event.metadata?.email || 'User';
    return `Failed login attempt for ${email}`;
  },
  'password.reset_requested': (event) => {
    const email = event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to request password reset for "${email}"`;
    }
    return `Password reset requested for ${email}`;
  },
  'password.reset_completed': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'Someone';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to complete password reset for "${name}"`;
    }
    return `${name} reset their password`;
  },
  'password.reset_requested_otp': (event) => {
    const email = event.metadata?.email || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to request password reset OTP for "${email}"`;
    }
    return `Password reset OTP requested for ${email}`;
  },
  'password.reset_completed_otp': (event) => {
    const name = event.metadata?.name || event.metadata?.email || 'Someone';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to complete password reset via email OTP for "${name}"`;
    }
    return `${name} reset their password via email OTP`;
  },
  'oauth.linked': (event) => {
    const provider = event.metadata?.provider || 'OAuth';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to link OAuth account "${provider}"`;
    }
    return `OAuth account linked: ${provider}`;
  },
  'oauth.unlinked': (event) => {
    const provider = event.metadata?.provider || 'OAuth';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to unlink OAuth account "${provider}"`;
    }
    return `OAuth account unlinked: ${provider}`;
  },
  'oauth.sign_in': (event) => {
    const provider = event.metadata?.provider || event.metadata?.providerId || 'OAuth';
    const name = event.metadata?.name || event.metadata?.userEmail || 'User';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'invalid credentials';
      return `Failed to sign in via ${provider} for "${name}"`;
    }
    return `${name} signed in via ${provider}`;
  },
  'team.created': (event) => {
    const teamName = event.metadata?.teamName || 'Team';
    const orgName = event.metadata?.organizationName || 'organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to create team "${teamName}" in "${orgName}"`;
    }
    return `Team "${teamName}" created in ${orgName}`;
  },
  'team.updated': (event) => {
    const teamName = event.metadata?.teamName || 'Team';
    const orgName = event.metadata?.organizationName || 'organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to update team "${teamName}" in "${orgName}"`;
    }
    return `Team "${teamName}" updated in ${orgName}`;
  },
  'team.deleted': (event) => {
    const teamName = event.metadata?.teamName || 'Team';
    const orgName = event.metadata?.organizationName || 'organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to delete team "${teamName}" from "${orgName}"`;
    }
    return `Team "${teamName}" deleted from ${orgName}`;
  },
  'team.member.added': (event) => {
    const memberName = event.metadata?.addedName || event.metadata?.addedEmail || 'Member';
    const teamName = event.metadata?.teamName || 'team';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to add member "${memberName}" to team "${teamName}"`;
    }
    return `${memberName} added to team "${teamName}"`;
  },
  'team.member.removed': (event) => {
    const memberName = event.metadata?.removedName || event.metadata?.removedEmail || 'Member';
    const teamName = event.metadata?.teamName || 'team';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to remove member "${memberName}" from team "${teamName}"`;
    }
    return `${memberName} removed from team "${teamName}"`;
  },
  'invitation.created': (event) => {
    const email = event.metadata?.email || 'user';
    const orgName = event.metadata?.organizationName || 'organization';
    const role = event.metadata?.role || 'member';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to create invitation for "${email}" to join "${orgName}"`;
    }
    return `Invitation sent to ${email} to join ${orgName} as ${role}`;
  },
  'invitation.accepted': (event) => {
    const email = event.metadata?.email || 'user';
    const orgName = event.metadata?.organizationName || 'organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to accept invitation for "${email}" to join "${orgName}"`;
    }
    return `${email} accepted invitation to join ${orgName}`;
  },
  'invitation.rejected': (event) => {
    const email = event.metadata?.email || 'user';
    const orgName = event.metadata?.organizationName || 'organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to reject invitation for "${email}" to join "${orgName}"`;
    }
    return `${email} rejected invitation to join ${orgName}`;
  },
  'invitation.cancelled': (event) => {
    const email = event.metadata?.email || 'user';
    const orgName = event.metadata?.organizationName || 'organization';
    if (event.status === 'failed') {
      const reason = event.metadata?.reason || 'unknown error';
      return `Failed to cancel invitation for "${email}" to join "${orgName}"`;
    }
    return `Invitation cancelled for ${email} to join ${orgName}`;
  },
};

export function getEventSeverity(
  event: AuthEvent | { type: AuthEventType; status?: 'success' | 'failed' },
  status?: 'success' | 'failed'
): 'info' | 'success' | 'warning' | 'failed' {
  // Use the status parameter if provided, otherwise use event.status
  const eventStatus =
    status || (typeof event === 'object' && 'status' in event ? event.status : undefined);

  // If status is 'failed', return 'failed' severity
  if (eventStatus === 'failed') {
    return 'failed';
  }

  const type = typeof event === 'object' && 'type' in event ? event.type : '';

  if (
    type.includes('joined') ||
    type.includes('created') ||
    type.includes('verified') ||
    type.includes('accepted') ||
    type.includes('added') ||
    type.includes('sign_in') ||
    type.includes('logged_in')
  ) {
    return 'success';
  }
  if (
    type.includes('failed') ||
    type.includes('banned') ||
    (type.includes('deleted') && !type.includes('verification'))
  ) {
    return 'failed';
  }
  if (type.includes('warning') || type.includes('reset') || type.includes('verification')) {
    return 'warning';
  }
  // rejected, cancelled, removed, updated are informational
  return 'info';
}

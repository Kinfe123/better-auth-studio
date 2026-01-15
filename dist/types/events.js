export const EVENT_TEMPLATES = {
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
        return `${name} updated`;
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
        const memberName = event.metadata?.memberName || event.metadata?.email || 'Member';
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
    'session.ended': (event) => {
        return 'Session ended';
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
        const name = event.metadata?.name || event.metadata?.email || 'User';
        if (event.status === 'failed') {
            const reason = event.metadata?.reason || 'invalid credentials';
            return `Failed to complete password reset for "${name}"`;
        }
        return `${name} completed password reset`;
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
};
export function getEventSeverity(event, status) {
    // Use the status parameter if provided, otherwise use event.status
    const eventStatus = status || (typeof event === 'object' && 'status' in event ? event.status : undefined);
    // If status is 'failed', return 'failed' severity
    if (eventStatus === 'failed') {
        return 'failed';
    }
    const type = typeof event === 'object' && 'type' in event ? event.type : '';
    if (type.includes('joined') || type.includes('created') || type.includes('verified')) {
        return 'success';
    }
    if (type.includes('failed') || type.includes('banned') || type.includes('deleted')) {
        return 'failed';
    }
    if (type.includes('warning') || type.includes('reset')) {
        return 'warning';
    }
    return 'info';
}
//# sourceMappingURL=events.js.map
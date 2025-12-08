import { Code, Copy, Mail, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CodeBlock } from '../components/CodeBlock';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import VisualEmailBuilder from '../components/VisualEmailBuilder';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  fields: string[];
  category: 'authentication' | 'organization' | 'notification';
}

const emailTemplates: Record<string, EmailTemplate> = {
  'password-reset': {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="margin-bottom: 30px;">
    <img src="https://www.better-auth.com/logo.png" alt="Better Auth" style="max-width: 70px; height: auto; display: block;">
  </div>
  <div style="background: #000; color: #fff; padding: 20px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 300;">Reset Your Password</h1>
  </div>
  
  <p>Hello {{user.name}},</p>
  
  <p>We received a request to reset your password. Click the button below to create a new password:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{url}}" style="display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 500;">Reset Password</a>
  </div>
  
  <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
  <p style="color: #666; font-size: 14px; word-break: break-all;">{{url}}</p>
  
  <p style="color: #666; font-size: 14px;">This link will expire in {{expiresIn}}.</p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© {{year}} Better Auth. All rights reserved.</p>
</body>
</html>`,
    fields: ['user.name', 'user.email', 'url', 'token', 'expiresIn'],
    category: 'authentication',
  },
  'email-verification': {
    id: 'email-verification',
    name: 'Email Verification',
    subject: 'Verify Your Email Address',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="margin-bottom: 30px;">
    <img src="https://www.better-auth.com/logo.png" alt="Better Auth" style="max-width: 70px; height: auto; display: block;">
  </div>
  <div style="background: #000; color: #fff; padding: 20px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 300;">Verify Your Email</h1>
  </div>
  
  <p>Hello {{user.name}},</p>
  
  <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{url}}" style="display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 500;">Verify Email</a>
  </div>
  
  <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
  <p style="color: #666; font-size: 14px; word-break: break-all;">{{url}}</p>
  
  <p style="color: #666; font-size: 14px;">This link will expire in {{expiresIn}}.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© {{year}} Better Auth. All rights reserved.</p>
</body>
</html>`,
    fields: ['user.name', 'user.email', 'url', 'token', 'expiresIn'],
    category: 'authentication',
  },
  'magic-link': {
    id: 'magic-link',
    name: 'Magic Link',
    subject: 'Sign in to your account',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="margin-bottom: 30px;">
    <img src="https://www.better-auth.com/logo.png" alt="Better Auth" style="max-width: 70px; height: auto; display: block;">
  </div>
  <div style="background: #000; color: #fff; padding: 20px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 300;">Sign In</h1>
  </div>
  
  <p>Hello,</p>
  
  <p>Click the button below to sign in to your account:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{url}}" style="display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 500;">Sign In</a>
  </div>
  
  <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
  <p style="color: #666; font-size: 14px; word-break: break-all;">{{url}}</p>
  
  <p style="color: #666; font-size: 14px;">This link will expire in {{expiresIn}}.</p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© {{year}} Better Auth. All rights reserved.</p>
</body>
</html>`,
    fields: ['user.email', 'url', 'token', 'expiresIn'],
    category: 'authentication',
  },
  'org-invitation': {
    id: 'org-invitation',
    name: 'Organization Invitation',
    subject: "You've been invited to {{organization.name}}",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organization Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="margin-bottom: 30px;">
    <img src="https://www.better-auth.com/logo.png" alt="Better Auth" style="max-width: 70px; height: auto; display: block;">
  </div>
  <div style="background: #000; color: #fff; padding: 20px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 300;">You've Been Invited</h1>
  </div>
  
  <p>Hello,</p>
  
  <p><strong>{{inviter.user.name}}</strong> has invited you to join <strong>{{organization.name}}</strong>.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{invitation.url}}" style="display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 500;">Accept Invitation</a>
  </div>
  
  <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
  <p style="color: #666; font-size: 14px; word-break: break-all;">{{invitation.url}}</p>
  
  <p style="color: #666; font-size: 14px;">This invitation will expire in {{expiresIn}}.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© {{year}} Better Auth. All rights reserved.</p>
</body>
</html>`,
    fields: [
      'invitation.url',
      'invitation.expiresAt',
      'invitation.email',
      'invitation.role',
      'inviter.user.name',
      'inviter.user.email',
      'organization.name',
      'organization.slug',
      'expiresIn',
    ],
    category: 'organization',
  },
  welcome: {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to {{app.name}}',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="margin-bottom: 30px;">
    <img src="https://www.better-auth.com/logo.png" alt="Better Auth" style="max-width: 70px; height: auto; display: block;">
  </div>
  <div style="background: #000; color: #fff; padding: 20px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 300;">Welcome!</h1>
  </div>
  
  <p>Hello {{user.name}},</p>
  
  <p>Welcome to {{app.name}}! We're excited to have you on board.</p>
  
  <p>Get started by exploring your dashboard and setting up your profile.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboardUrl}}" style="display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 500;">Go to Dashboard</a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© {{year}} Better Auth. All rights reserved.</p>
</body>
</html>`,
    fields: ['user.name', 'user.email', 'app.name', 'dashboardUrl'],
    category: 'notification',
  },
  'email-otp': {
    id: 'email-otp',
    name: 'Email OTP',
    subject: 'Your Verification Code',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="margin-bottom: 30px;">
    <img src="https://www.better-auth.com/logo.png" alt="Better Auth" style="max-width: 70px; height: auto; display: block;">
  </div>
  <div style="background: #000; color: #fff; padding: 20px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 300;">Verification Code</h1>
  </div>
  
  <p>Hello,</p>
  
  <p>Your verification code is:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <div style="display: inline-block; background: #f5f5f5; border: 2px dashed #000; padding: 20px 40px; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
      {{otp}}
    </div>
  </div>
  
  <p style="color: #666; font-size: 14px;">This code will expire in {{expiresIn}}.</p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© {{year}} Better Auth. All rights reserved.</p>
</body>
</html>`,
    fields: ['email', 'otp', 'type', 'expiresIn'],
    category: 'authentication',
  },
};

export default function EmailEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [emailHtml, setEmailHtml] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'authentication' | 'organization' | 'notification'
  >('all');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showFieldSimulator, setShowFieldSimulator] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (showCodeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCodeModal]);

  // If a template is preselected externally, you can set it here; otherwise remains null until user selects

  const handleSelectTemplate = (templateId: string) => {
    const template = emailTemplates[templateId];
    if (template) {
      setSelectedTemplate(templateId);
      setEmailHtml(template.html);
      setEmailSubject(template.subject);
      setRenderedHtml(template.html);
      const defaults: Record<string, string> = {};
      template.fields.forEach((field) => {
        if (field.includes('user.name')) defaults[field] = 'John Doe';
        else if (field.includes('user.email')) defaults[field] = 'john@example.com';
        else if (field.includes('url')) defaults[field] = 'https://example.com/reset?token=abc123';
        else if (field.includes('token')) defaults[field] = 'abc123xyz';
        else if (field.includes('expiresIn')) defaults[field] = '24 hours';
        else if (field.includes('app.name')) defaults[field] = 'My App';
        else if (field.includes('org.name')) defaults[field] = 'Acme Corp';
        else if (field.includes('org.slug')) defaults[field] = 'acme-corp';
        else if (field.includes('inviter.name')) defaults[field] = 'Jane Smith';
        else if (field.includes('inviter.email')) defaults[field] = 'jane@example.com';
        else if (field.includes('role')) defaults[field] = 'member';
        else if (field.includes('dashboardUrl')) defaults[field] = 'https://example.com/dashboard';
        else if (field === 'email') defaults[field] = 'user@example.com';
        else if (field === 'otp') defaults[field] = '123456';
        else if (field === 'type') defaults[field] = 'sign-in';
        else if (field.includes('expiresIn')) defaults[field] = '5 minutes';
      });
      setFieldValues(defaults);
    }
  };

  const handleHtmlChange = (newHtml: string) => {
    setEmailHtml(newHtml);
  };

  const handleSubjectChange = (newSubject: string) => {
    setEmailSubject(newSubject);
  };

  const handleApplyToAuth = async (templateId: string) => {
    const subjectToApply =
      emailSubject || emailTemplates[templateId]?.subject || 'Email subject';
    const htmlToApply =
      renderedHtml || emailHtml || emailTemplates[templateId]?.html || '';
    setIsApplying(true);
    try {
      const resp = await fetch('/api/tools/apply-email-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, subject: subjectToApply, html: htmlToApply }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || 'Failed to apply to auth.ts');
      }
      toast.success('Applied to auth.ts');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to apply to auth.ts');
    } finally {
      setIsApplying(false);
    }
  };

  const getSimulatedHtml = (html: string): string => {
    let simulatedHtml = html.replace(/\{\{year\}\}/g, new Date().getFullYear().toString());
    Object.entries(fieldValues).forEach(([field, value]) => {
      const placeholder = `{{${field}}}`;
      simulatedHtml = simulatedHtml.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        value
      );
    });
    return simulatedHtml;
  };

  const handleApplyFields = () => {
    setRenderedHtml(getSimulatedHtml(emailHtml));
  };

  const generateCodeSnippet = (templateId: string) => {
    const template = emailTemplates[templateId];
    if (!template) return '';

    const currentHtml = emailHtml || template.html;
    const currentSubject = emailSubject || template.subject;

    const escapeForTemplate = (str: string) => {
      return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
    };

    const escapedHtml = escapeForTemplate(currentHtml);
    const escapedSubject = escapeForTemplate(currentSubject);

    const codeSnippets: Record<string, string> = {
      'password-reset': `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... other config
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: user.email,
        subject: \`${escapedSubject}\`,
        html: \`${escapedHtml}\`,
      });
    },
  },
});`,
      'email-verification': `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... other config
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: user.email,
        subject: \`${escapedSubject}\`,
        html: \`${escapedHtml}\`,
      });
    },
  },
});`,
      'magic-link': `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... other config
  emailAndPassword: {
    enabled: true,
    sendMagicLinkEmail: async ({ email, url, token }) => {
      await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: email,
        subject: \`${escapedSubject}\`,
        html: \`${escapedHtml}\`,
      });
    },
  },
});`,
      'org-invitation': `import { Resend } from 'resend';
import { organization } from 'better-auth/plugins';
import type { User, Organization, Invitation, Member } from 'better-auth/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... other config
  plugins: [
    organization({
      sendInvitationEmail: async (data, request) => {
        const { invitation, organization, inviter } = data;
        const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
        const url = \`\${baseUrl}/accept-invitation?id=\${invitation.id}\`;

        const subject = \`${escapedSubject}\`
          .replace(/{{organization.name}}/g, organization?.name || '')
          .replace(/{{invitation.role}}/g, invitation.role || '')
          .replace(/{{inviter.user.name}}/g, inviter?.user?.name || '')
          .replace(/{{inviter.user.email}}/g, inviter?.user?.email || '')
          .replace(/{{invitation.email}}/g, invitation.email || '');

        const html = \`${escapedHtml}\`
          .replace(/{{invitation.url}}/g, url)
          .replace(/{{invitation.role}}/g, invitation.role || '')
          .replace(/{{organization.name}}/g, organization?.name || '')
          .replace(/{{organization.slug}}/g, organization?.slug || '')
          .replace(/{{inviter.user.name}}/g, inviter?.user?.name || '')
          .replace(/{{inviter.user.email}}/g, inviter?.user?.email || '')
          .replace(/{{invitation.email}}/g, invitation.email || '')
          .replace(/{{invitation.expiresAt}}/g, invitation.expiresAt?.toLocaleString() || '')
          .replace(/{{expiresIn}}/g, invitation.expiresAt ? \`\${Math.ceil((invitation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days\` : '');

        await resend.emails.send({
          from: 'noreply@yourdomain.com',
          to: invitation.email,
          subject,
          html,
        });
      },
    }),
  ],
});`,
      welcome: `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... other config
  emailAndPassword: {
    enabled: true,
    sendWelcomeEmail: async ({ user }) => {
      await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: user.email,
        subject: \`${escapedSubject}\`,
        html: \`${escapedHtml}\`,
      });
    },
  },
});`,
      'email-otp': `import { Resend } from 'resend';
import { emailOTP } from 'better-auth/plugins';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... other config
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        await resend.emails.send({
          from: 'noreply@yourdomain.com',
          to: email,
          subject: \`${escapedSubject}\`,
          html: \`${escapedHtml}\`,
        });
      },
    }),
  ],
});`,
    };

    return codeSnippets[templateId] || '';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredTemplates = Object.values(emailTemplates).filter(
    (template) => activeCategory === 'all' || template.category === activeCategory
  );

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex items-center justify-between p-5 pt-7">
        <div className="pb-8">
          <h1 className="text-3xl font-normal text-white tracking-tight">Emails</h1>
          <p className="text-gray-300 mt-2 uppercase font-mono font-light text-xs">
            Customize your email templates with a visual editor
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center space-y-8">
        <hr className="w-full border-white/15 h-px" />
        <hr className="w-full border-white/15 h-px" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[340px] border-r border-dashed border-white/15 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-dashed border-white/15 flex-shrink-0">
            <h2 className="text-lg font-light text-white uppercase tracking-wider mb-4">
              Templates
            </h2>
            <div className="flex flex-wrap gap-2">
              {(['all', 'authentication', 'organization', 'notification'] as const).map(
                (category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-2 py-1 text-[10px] font-mono uppercase border border-dashed rounded-none transition-colors ${
                      activeCategory === category
                        ? 'border-white/30 bg-white/5 text-white'
                        : 'border-white/10 bg-black/40 text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {category}
                  </button>
                )
              )}
            </div>
          </div>
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2"
            style={{ overscrollBehavior: 'contain' }}
          >
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className={`w-full text-left p-3 border border-dashed rounded-none transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-white/30 bg-white/5 text-white'
                    : 'border-white/15 bg-black/40 text-gray-300 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="text-sm uppercase font-mono">{template.name}</div>
                <div className="text-xs text-gray-500 mt-1">{template.fields.length} fields</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTemplate ? (
            <>
              <div className="border-b border-dashed border-white/15 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-light text-white uppercase tracking-wider">
                    {emailTemplates[selectedTemplate]?.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-1">
                    {emailTemplates[selectedTemplate]?.category}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const code = generateCodeSnippet(selectedTemplate);
                      if (code) {
                        setShowCodeModal(true);
                      }
                    }}
                    className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Export Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(emailHtml)}
                    className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy HTML
                  </Button>
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-dashed border-white/10 bg-black/40">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                        Subject
                      </Label>
                      <Input
                        value={emailSubject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        placeholder="Email subject"
                        className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-sm"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFieldSimulator(!showFieldSimulator)}
                      className="h-10 border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                    >
                      {showFieldSimulator ? 'Hide' : 'Show'} Fields
                    </Button>
                  </div>
                </div>

                {showFieldSimulator && selectedTemplate && (
                  <div className="p-4 border-b overflow-hidden border-dashed border-white/10 bg-black/30">
                    <Label className="text-xs uppercase font-mono text-gray-400 mb-3 block">
                      Fields
                    </Label>
                    <div className="grid grid-cols-2 gap-3 max-h-full overflow-y-hidden">
                      {emailTemplates[selectedTemplate]?.fields.map((field) => (
                        <div key={field}>
                          <Label className="text-xs font-mono text-gray-400 mb-1 block">
                            {field}
                          </Label>
                          <Input
                            value={fieldValues[field] || ''}
                            onChange={(e) =>
                              setFieldValues((prev) => ({ ...prev, [field]: e.target.value }))
                            }
                            placeholder={`{{${field}}}`}
                            className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        onClick={handleApplyFields}
                        className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                      >
                        Apply Changes
                      </Button>
                    </div>
                  </div>
                )}
                {selectedTemplate && (
                  <div className="p-4 border-b border-dashed border-white/10 bg-black/40">
                    <Label className="text-xs uppercase font-mono text-gray-400 mb-3 block">
                      Dynamic Fields
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {emailTemplates[selectedTemplate]?.fields.map((field) => (
                        <div key={field} className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`{{${field}}}`)}
                            className="text-xs rounded-none border border-dashed border-white/20 hover:bg-white/10"
                          >
                            {field}
                          </Button>
                          <span className="text-xs text-gray-500 font-mono">{`{{${field}}}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-hidden">
                  <VisualEmailBuilder
                    html={renderedHtml || emailHtml}
                    onChange={handleHtmlChange}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="text-center">
                <Mail className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-gray-400 font-mono uppercase text-sm">
                  Select a template to start editing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCodeModal && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCodeModal(false);
            }
          }}
        >
          <div
            className="bg-black border border-white/15 rounded-none p-0 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-0 pt-2  border-white/15 border-b-0 bg-black/50">
              <div className="flex items-center justify-between p-2 pt-2">
                <div className="pb-2">
                  <h1 className="text-xl font-normal uppercase text-white tracking-tight">
                    Export
                  </h1>
                  <p className="text-gray-300 mt-2 uppercase font-mono font-light text-xs">
                    Export the code for the selected template
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCodeModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center">
              <hr className="w-full border-white/15 h-px" />
              <div className="relative z-20 h-8 w-[calc(100%)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#e0f2fe,#e0f2fe_1px,transparent_1px,transparent_6px)] opacity-[8%]" />
              <hr className="w-full border-white/15 h-px" />
            </div>

            <div className="flex-1 overflow-auto p-6 bg-black">
              <CodeBlock
                code={generateCodeSnippet(selectedTemplate)}
                language="typescript"
                fileName="auth.ts"
              />
            </div>
            <div className="flex items-center justify-end p-6 border-t border-white/15 bg-black/50">
              <Button
                onClick={() => handleApplyToAuth(selectedTemplate)}
                disabled={isApplying}
                className="bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase text-xs px-6 py-2"
              >
                {isApplying ? 'Applying...' : 'Apply to auth config'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Code, Copy, Loader, Mail, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check } from "@/components/PixelIcons";
import { CodeBlock } from "../components/CodeBlock";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import VisualEmailBuilder from "../components/VisualEmailBuilder";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  fields: string[];
  category: "authentication" | "organization" | "notification";
}

const emailTemplates: Record<string, EmailTemplate> = {
  "password-reset": {
    id: "password-reset",
    name: "Password Reset",
    subject: "Reset Your Password",
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
    fields: ["user.name", "user.email", "url", "token", "expiresIn"],
    category: "authentication",
  },
  "email-verification": {
    id: "email-verification",
    name: "Email Verification",
    subject: "Verify Your Email Address",
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
    fields: ["user.name", "user.email", "url", "token", "expiresIn"],
    category: "authentication",
  },
  "magic-link": {
    id: "magic-link",
    name: "Magic Link",
    subject: "Sign in to your account",
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
    fields: ["user.email", "url", "token", "expiresIn"],
    category: "authentication",
  },
  "org-invitation": {
    id: "org-invitation",
    name: "Organization Invitation",
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
    <img src="https://better-auth.com/logo.png" alt="Better Auth" style="max-width: 70px; height: auto; display: block;">
  </div>
  <div style="background: #000; color: #fff; padding: 20px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 300;">You've Been Invited</h1>
  </div>
  
  <p>Hello, </p>
  
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
      "invitation.url",
      "invitation.expiresAt",
      "invitation.email",
      "invitation.role",
      "inviter.user.name",
      "inviter.user.email",
      "organization.name",
      "organization.slug",
      "expiresIn",
    ],
    category: "organization",
  },
  "email-otp": {
    id: "email-otp",
    name: "Email OTP",
    subject: "Your Verification Code",
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
  
  <div style="text-align: center; margin: 40px 0;">
    <div style="display: inline-flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      {{otpDigits}}
    </div>
  </div>
  
  <p style="text-align: center; color: #666; font-size: 16px; font-weight: 500; letter-spacing: 4px; font-family: monospace; margin: 20px 0;">
    {{otp}}
  </p>
  
  <p style="color: #666; font-size: 14px; text-align: left; margin-top: 30px;">
    This code will expire in <strong style="color: #000;">{{expiresIn}}</strong>.
  </p>
  
  <p style="color: #666; font-size: 14px; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© {{year}} Better Auth. All rights reserved.</p>
</body>
</html>`,
    fields: ["email", "otp", "type", "expiresIn"],
    category: "authentication",
  },
};

export default function EmailEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [emailHtml, setEmailHtml] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "authentication" | "organization" | "notification"
  >("all");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showFieldSimulator, setShowFieldSimulator] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testFieldValues, setTestFieldValues] = useState<Record<string, string>>({});
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [resendApiKeyStatus, setResendApiKeyStatus] = useState<
    "checking" | "found" | "missing" | null
  >(null);
  const [verifiedSenders, setVerifiedSenders] = useState<string[]>([]);
  const [fromEmail, setFromEmail] = useState("");
  const [testSubject, setTestSubject] = useState("");

  useEffect(() => {
    if (showCodeModal || showResendModal || showTestEmailModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCodeModal, showResendModal, showTestEmailModal]);

  useEffect(() => {
    if (showTestEmailModal && selectedTemplate) {
      const template = emailTemplates[selectedTemplate];
      if (template) {
        const initialValues: Record<string, string> = {};
        template.fields.forEach((field) => {
          initialValues[field] = fieldValues[field] || "";
        });
        setTestFieldValues(initialValues);
        setTestSubject(emailSubject || template.subject || "");
        checkResendApiKey();
      }
    }
  }, [showTestEmailModal, selectedTemplate, emailSubject]);

  const checkResendApiKey = async () => {
    setResendApiKeyStatus("checking");
    try {
      const response = await fetch("/api/tools/check-resend-api-key");
      const data = await response.json();
      if (data.hasApiKey) {
        setResendApiKeyStatus("found");
        if (data.verifiedSenders && data.verifiedSenders.length > 0) {
          setVerifiedSenders(data.verifiedSenders);
          setFromEmail(data.verifiedSenders[0]);
        }
      } else {
        setResendApiKeyStatus("missing");
        setVerifiedSenders([]);
        setFromEmail("");
      }
    } catch (error) {
      setResendApiKeyStatus("missing");
      setVerifiedSenders([]);
      setFromEmail("");
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !selectedTemplate || !testSubject) return;

    setIsSendingTestEmail(true);
    try {
      const template = emailTemplates[selectedTemplate];
      const baseHtml = emailHtml || template?.html || "";
      const baseSubject = testSubject || template?.subject || "Test Email";

      if (!fromEmail) {
        toast.error("Please select or enter a verified sender email address");
        return;
      }

      const response = await fetch("/api/tools/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          to: testEmailAddress,
          from: fromEmail,
          subject: baseSubject,
          html: baseHtml,
          fieldValues: testFieldValues,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send test email");
      }
      toast.success("Test email sent successfully!");
      setShowTestEmailModal(false);
      setTestEmailAddress("");
      setTestSubject("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send test email");
    } finally {
      setIsSendingTestEmail(false);
    }
  };

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
        if (field.includes("user.name")) defaults[field] = "John Doe";
        else if (field.includes("user.email")) defaults[field] = "john@example.com";
        else if (field.includes("url")) defaults[field] = "https://example.com/reset?token=abc123";
        else if (field.includes("token")) defaults[field] = "abc123xyz";
        else if (field.includes("expiresIn")) defaults[field] = "24 hours";
        else if (field.includes("app.name")) defaults[field] = "My App";
        else if (field.includes("org.name")) defaults[field] = "Acme Corp";
        else if (field.includes("org.slug")) defaults[field] = "acme-corp";
        else if (field.includes("inviter.name")) defaults[field] = "Jane Smith";
        else if (field.includes("inviter.email")) defaults[field] = "jane@example.com";
        else if (field.includes("role")) defaults[field] = "member";
        else if (field.includes("dashboardUrl")) defaults[field] = "https://example.com/dashboard";
        else if (field === "email") defaults[field] = "user@example.com";
        else if (field === "otp") defaults[field] = "123456";
        else if (field === "type") defaults[field] = "sign-in";
        else if (field.includes("expiresIn")) defaults[field] = "5 minutes";
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

  const handleApplyToAuth = () => {
    setShowResendModal(true);
  };

  const confirmApplyToAuth = async (templateId: string) => {
    setShowResendModal(false);
    const subjectToApply = emailSubject || emailTemplates[templateId]?.subject || "Email subject";
    const htmlToApply = renderedHtml || emailHtml || emailTemplates[templateId]?.html || "";
    setIsApplying(true);
    try {
      const resp = await fetch("/api/tools/apply-email-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, subject: subjectToApply, html: htmlToApply }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || "Failed to apply to auth.ts");
      }
      toast.success("Applied to auth.ts");
    } catch (err: any) {
      toast.error(err?.message || "Failed to apply to auth.ts");
    } finally {
      setIsApplying(false);
    }
  };

  const getSimulatedHtml = (html: string): string => {
    let simulatedHtml = html.replace(/\{\{year\}\}/g, new Date().getFullYear().toString());
    Object.entries(fieldValues).forEach(([field, value]) => {
      const placeholder = `{{${field}}}`;
      simulatedHtml = simulatedHtml.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        value,
      );
    });
    return simulatedHtml;
  };

  const handleApplyFields = () => {
    setRenderedHtml(getSimulatedHtml(emailHtml));
  };

  // Memoize the HTML prop to prevent unnecessary re-renders of VisualEmailBuilder
  const memoizedHtml = useMemo(() => renderedHtml || emailHtml, [renderedHtml, emailHtml]);

  const generateCodeSnippet = (templateId: string) => {
    const template = emailTemplates[templateId];
    if (!template) return "";

    const currentHtml = emailHtml || template.html;
    const currentSubject = emailSubject || template.subject;

    const escapeForTemplate = (str: string) => {
      return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\${/g, "\\${");
    };

    const escapedHtml = escapeForTemplate(currentHtml);
    const escapedSubject = escapeForTemplate(currentSubject);

    const codeSnippets: Record<string, string> = {
      "password-reset": `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... other config
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      const subject = \`${escapedSubject}\`
        .replace(/{{user.name}}/g, user?.name || '')
        .replace(/{{user.email}}/g, user?.email || '');

      const html = \`${escapedHtml}\`
        .replace(/{{user.name}}/g, user?.name || '')
        .replace(/{{user.email}}/g, user?.email || '')
        .replace(/{{url}}/g, url || '')
        .replace(/{{token}}/g, token || '');

      await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: user.email,
        subject,
        html,
      });
    },
  },
});`,
      "email-verification": `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... other config
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      const subject = \`${escapedSubject}\`
        .replace(/{{user.name}}/g, user?.name || '')
        .replace(/{{user.email}}/g, user?.email || '');

      const html = \`${escapedHtml}\`
        .replace(/{{user.name}}/g, user?.name || '')
        .replace(/{{user.email}}/g, user?.email || '')
        .replace(/{{url}}/g, url || '')
        .replace(/{{token}}/g, token || '');

      await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: user.email,
        subject,
        html,
      });
    },
  },
});`,
      "magic-link": `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... other config
  emailAndPassword: {
    enabled: true,
    sendMagicLinkEmail: async ({ email, url, token }) => {
      const subject = \`${escapedSubject}\`
        .replace(/{{user.email}}/g, email || '');

      const html = \`${escapedHtml}\`
        .replace(/{{user.email}}/g, email || '')
        .replace(/{{url}}/g, url || '')
        .replace(/{{token}}/g, token || '');

      await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: email,
        subject,
        html,
      });
    },
  },
});`,
      "org-invitation": `import { Resend } from 'resend';
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
      "email-otp": `import { Resend } from 'resend';
import { emailOTP } from 'better-auth/plugins';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... other config
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        // Split OTP into individual digits for better UI
        const otpDigits = (otp || '').split('');
        const otpBoxes = otpDigits.map(
          (digit) => \`<div style="display: inline-block; width: 50px; height: 60px; line-height: 60px; text-align: center; background: #f5f5f5; border: 2px solid #000; border-radius: 8px; font-size: 28px; font-weight: bold; font-family: monospace; margin: 0 4px;">\${digit}</div>\`
        ).join('');

        // Calculate expiresIn (default 10 minutes if not provided)
        // You can adjust this based on your OTP expiration settings
        const expiresInMinutes = 10;
        const expiresIn = expiresInMinutes === 1 ? '1 minute' : \`\${expiresInMinutes} minutes\`;

        const subject = \`${escapedSubject}\`
          .replace(/{{email}}/g, email || '')
          .replace(/{{otp}}/g, otp || '')
          .replace(/{{type}}/g, type || '')
          .replace(/{{expiresIn}}/g, expiresIn);

        const html = \`${escapedHtml}\`
          .replace(/{{email}}/g, email || '')
          .replace(/{{otp}}/g, otp || '')
          .replace(/{{type}}/g, type || '')
          .replace(/{{expiresIn}}/g, expiresIn)
          .replace(/{{otpDigits}}/g, otpBoxes);

        await resend.emails.send({
          from: 'noreply@yourdomain.com',
          to: email,
          subject,
          html,
        });
      },
    }),
  ],
});`,
    };

    return codeSnippets[templateId] || "";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const filteredTemplates = Object.values(emailTemplates).filter(
    (template) => activeCategory === "all" || template.category === activeCategory,
  );

  return (
    <div className="min-h-full md:h-full flex flex-col bg-black">
      <div className="flex items-center justify-between p-3 md:p-5 pt-4 md:pt-7">
        <div className="pb-4 md:pb-8">
          <h1 className="text-xl md:text-3xl font-normal text-white tracking-tight">Emails</h1>
          <p className="text-gray-300 mt-1 md:mt-2 uppercase font-mono font-light text-[10px] md:text-xs">
            Customize your email templates with a visual editor
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center space-y-8">
        <hr className="w-full border-white/15 h-px" />
        <hr className="w-full border-white/15 h-px" />
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <div className="w-full md:w-[340px] md:border-r border-dashed border-white/15 flex flex-col overflow-hidden md:flex-shrink-0">
          <div className="p-3 md:p-4 border-b border-dashed border-white/15 flex-shrink-0">
            <h2 className="text-base md:text-lg font-light text-white uppercase tracking-wider mb-3 md:mb-4">
              Templates
            </h2>
            <div className="flex flex-wrap gap-2">
              {(["all", "authentication", "organization", "notification"] as const).map(
                (category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-2 py-1 text-[10px] font-mono uppercase border border-dashed rounded-none transition-colors ${
                      activeCategory === category
                        ? "border-white/30 bg-white/5 text-white"
                        : "border-white/10 bg-black/40 text-gray-300 hover:border-white/20"
                    }`}
                  >
                    {category}
                  </button>
                ),
              )}
            </div>
          </div>
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 space-y-2 min-h-[120px] md:min-h-0"
            style={{ overscrollBehavior: "contain" }}
          >
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className={`w-full text-left p-2.5 md:p-3 border border-dashed rounded-none transition-colors ${
                  selectedTemplate === template.id
                    ? "border-white/30 bg-white/5 text-white"
                    : "border-white/15 bg-black/40 text-gray-300 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="text-xs md:text-sm uppercase font-mono">{template.name}</div>
                <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">
                  {template.fields.length} fields
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {selectedTemplate ? (
            <>
              <div className="border-b border-dashed border-white/15 p-3 md:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-light text-white uppercase tracking-wider truncate">
                    {emailTemplates[selectedTemplate]?.name}
                  </h3>
                  <p className="text-[10px] md:text-xs text-gray-400 font-mono mt-0.5 md:mt-1">
                    {emailTemplates[selectedTemplate]?.category}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowTestEmailModal(true)}
                    className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none text-xs h-8 md:h-10 px-2 md:px-4"
                  >
                    <Send className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Test Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const code = generateCodeSnippet(selectedTemplate);
                      if (code) {
                        setShowCodeModal(true);
                      }
                    }}
                    className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none text-xs h-8 md:h-10 px-2 md:px-4"
                  >
                    <Code className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Export Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(emailHtml)}
                    className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none text-xs h-8 md:h-10 px-2 md:px-4"
                  >
                    <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Copy HTML
                  </Button>
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="p-3 md:p-4 border-b border-dashed border-white/10 bg-black/40">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label className="text-[10px] md:text-xs uppercase font-mono text-gray-400 mb-1.5 md:mb-2 block">
                        Subject
                      </Label>
                      <Input
                        value={emailSubject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        placeholder="Email subject"
                        className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs md:text-sm"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFieldSimulator(!showFieldSimulator)}
                      className="h-8 md:h-10 border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none text-xs shrink-0"
                    >
                      {showFieldSimulator ? "Hide" : "Show"} Fields
                    </Button>
                  </div>
                </div>

                {showFieldSimulator && selectedTemplate && (
                  <div className="p-3 md:p-4 border-b overflow-y-auto border-dashed border-white/10 bg-black/30 max-h-[200px] md:max-h-full">
                    <Label className="text-[10px] md:text-xs uppercase font-mono text-gray-400 mb-2 md:mb-3 block">
                      Fields
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 max-h-full overflow-y-hidden">
                      {emailTemplates[selectedTemplate]?.fields.map((field) => (
                        <div key={field}>
                          <Label className="text-xs font-mono text-gray-400 mb-1 block">
                            {field}
                          </Label>
                          <Input
                            value={fieldValues[field] || ""}
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
                  <div className="p-3 md:p-4 border-b border-dashed border-white/10 bg-black/40">
                    <Label className="text-[10px] md:text-xs uppercase font-mono text-gray-400 mb-2 md:mb-3 block">
                      Dynamic Fields
                    </Label>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
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
                  <VisualEmailBuilder html={memoizedHtml} onChange={handleHtmlChange} />
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
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 overflow-hidden p-3 md:p-6"
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
            <div className="flex items-center justify-between px-3 md:px-6 py-0 pt-2 border-white/15 border-b-0 bg-black/50">
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

            <div className="flex-1 overflow-auto p-3 md:p-6 bg-black">
              <CodeBlock
                code={generateCodeSnippet(selectedTemplate)}
                language="typescript"
                fileName="auth.ts"
              />
            </div>
            <div className="flex items-center justify-end p-3 md:p-6 border-t border-white/15 bg-black/50">
              <Button
                onClick={handleApplyToAuth}
                disabled={isApplying}
                className="bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase font-medium text-xs tracking-tight px-6 py-2"
              >
                {isApplying ? "Applying..." : "Apply to auth config"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showResendModal && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 overflow-hidden p-3 md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResendModal(false);
            }
          }}
        >
          <div
            className="bg-black border border-white/15 rounded-none p-0 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-white/15 border-b bg-black/50">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-normal uppercase text-white tracking-tight">
                    Setup Required
                  </h1>
                  <p className="text-gray-300 mt-2 uppercase font-mono font-light text-xs">
                    Install Resend before applying email template
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResendModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8 bg-black">
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-sm md:text-base font-mono uppercase font-normal text-white mb-2 md:mb-3">
                    Install Resend
                  </h2>
                  <p className="text-gray-300 mb-4 font-sans leading-relaxed">
                    You need to install the Resend package to send emails. Run the following command
                    in your terminal:
                  </p>
                  <div className="bg-black/80 border border-dashed border-white/20 p-2 pl-3 rounded-none font-mono text-sm relative group">
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-gray-200">
                        <span className="text-white">$</span>{" "}
                        <span className="text-blue-600">pnpm</span>{" "}
                        <span className="text-white">install</span>{" "}
                        <span className="text-white">resend</span>
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("pnpm install resend");
                          setCommandCopied(true);
                          setTimeout(() => setCommandCopied(false), 2000);
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-none transition-colors text-gray-300 hover:text-white"
                        title="Copy command"
                      >
                        {commandCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/15 bg-black/50">
              <Button
                variant="ghost"
                onClick={() => setShowResendModal(false)}
                className="text-gray-400 hover:text-white rounded-none font-mono uppercase font-medium text-xs tracking-tight px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={() => confirmApplyToAuth(selectedTemplate)}
                disabled={isApplying}
                className="bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase font-medium text-xs tracking-tight px-6 py-2"
              >
                {isApplying ? "Applying..." : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTestEmailModal && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 overflow-hidden p-3 md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTestEmailModal(false);
            }
          }}
        >
          <div
            className="bg-black border border-white/15 rounded-none p-0 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-white/15 border-b bg-black/50">
              <div className="flex items-center justify-between min-w-0">
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-normal uppercase text-white tracking-tight">
                    Test Email
                  </h1>
                  <p className="text-gray-300 mt-1 md:mt-2 uppercase font-mono font-light text-[10px] md:text-xs">
                    Send a test email with dynamic values
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTestEmailModal(false)}
                className="text-gray-400 hover:text-white rounded-none flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8 bg-black">
              <div className="space-y-6">
                {resendApiKeyStatus === "checking" && (
                  <div className="bg-black/90 flex border p-4 rounded-none border-dashed border-white/20">
                    <p className="text-white text-sm font-sans flex items-center gap-2 leading-relaxed">
                      <Loader className="w-4 h-4 animate-spin mr-1" /> Checking for
                      RESEND_API_KEY...
                    </p>
                  </div>
                )}

                {resendApiKeyStatus === "missing" && (
                  <div className="bg-red-900/20 border border-red-500/30 border-dashed p-4 rounded-none">
                    <p className="text-red-200 text-sm font-sans leading-relaxed mb-2">
                      <strong className="font-normal uppercase font-mono">
                        RESEND_API_KEY not found
                      </strong>
                    </p>
                    <p className="text-red-200 text-sm font-sans leading-relaxed">
                      Please add{" "}
                      <code className="bg-black/50 px-1 py-0.5 rounded font-mono text-xs">
                        RESEND_API_KEY
                      </code>{" "}
                      to your{" "}
                      <code className="bg-black/50 px-1 py-0.5 rounded font-mono text-xs">
                        .env
                      </code>{" "}
                      file.
                    </p>
                  </div>
                )}

                {resendApiKeyStatus === "found" && (
                  <>
                    <div>
                      <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                        From Email (Verified Sender) *
                      </Label>
                      {verifiedSenders.length > 0 ? (
                        <select
                          value={fromEmail}
                          onChange={(e) => setFromEmail(e.target.value)}
                          className="w-full bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs p-2 focus:outline-none focus:border-white/40"
                        >
                          {verifiedSenders.map((sender) => (
                            <option key={sender} value={sender}>
                              {sender}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type="email"
                          value={fromEmail}
                          onChange={(e) => setFromEmail(e.target.value)}
                          placeholder="noreply@yourdomain.com"
                          className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-1 font-sans">
                        {verifiedSenders.length > 0
                          ? "Select a verified sender email from your Resend account"
                          : "Enter a verified sender email address from your Resend account"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                        Subject *
                      </Label>
                      <Input
                        type="text"
                        value={testSubject}
                        onChange={(e) => setTestSubject(e.target.value)}
                        placeholder="Email subject"
                        className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                      />
                      <p className="text-xs text-gray-500 mt-1 font-sans">
                        Email subject line (supports dynamic placeholders)
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                        To Email Address *
                      </Label>
                      <Input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder="recipient@example.com"
                        className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                      />
                      <p className="text-xs text-gray-500 mt-1 font-sans">
                        Any email address to receive the test email
                      </p>
                    </div>

                    {emailTemplates[selectedTemplate]?.fields &&
                      emailTemplates[selectedTemplate].fields.length > 0 && (
                        <div>
                          <Label className="text-xs uppercase font-mono text-gray-400 mb-3 block">
                            Dynamic Values
                          </Label>
                          <div className="space-y-3">
                            {emailTemplates[selectedTemplate].fields.map((field) => (
                              <div key={field}>
                                <Label className="text-xs uppercase font-mono text-gray-500 mb-1 block">
                                  {field}
                                </Label>
                                <Input
                                  value={testFieldValues[field] || ""}
                                  onChange={(e) =>
                                    setTestFieldValues({
                                      ...testFieldValues,
                                      [field]: e.target.value,
                                    })
                                  }
                                  placeholder={`Enter ${field}`}
                                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/15 bg-black/50">
              <Button
                variant="ghost"
                onClick={() => setShowTestEmailModal(false)}
                className="text-gray-400 hover:text-white rounded-none font-mono uppercase font-medium text-xs tracking-tight px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendTestEmail}
                disabled={
                  isSendingTestEmail ||
                  resendApiKeyStatus !== "found" ||
                  !testEmailAddress ||
                  !fromEmail ||
                  !testSubject
                }
                className="bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase font-medium text-xs tracking-tight px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingTestEmail ? "Sending..." : "Send Test Email"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

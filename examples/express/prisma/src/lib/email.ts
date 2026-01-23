export const sendTestEmail = async (to: string, subject: string) => {
  console.log(`Sending test email to ${to}: ${subject}`);
  return { success: true, message: "Email sent successfully" };
};

export const emailConfig = {
  from: "noreply@example.com",
  provider: "test",
};

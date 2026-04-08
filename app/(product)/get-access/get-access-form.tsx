import { ArrowRightIcon, EmailOtpAuthForm } from "../components/email-otp-auth-form";

export function GetAccessForm() {
  return (
    <EmailOtpAuthForm
      title="Access WHIM attendance"
      description="Enter your email for a one-time code."
      otpType="email"
      shouldCreateUser={true}
      redirectPath="/dashboard"
      flowLabel="sign-in"
      googleRedirectPath="/dashboard"
      googleCtaMode="default"
      submitCtaMode="inline"
      sendLabel={<ArrowRightIcon />}
      verifyLabel="Continue"
      links={[]}
    />
  );
}

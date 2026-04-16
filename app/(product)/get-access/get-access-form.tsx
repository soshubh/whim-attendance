import { ArrowRightIcon, EmailOtpAuthForm } from "../components/email-otp-auth-form";

export function GetAccessForm({ initialMessage = "" }: { initialMessage?: string }) {
  return (
    <EmailOtpAuthForm
      title="Access WHIM attendance"
      description="Enter your email for a one-time code."
      otpType="email"
      shouldCreateUser={true}
      redirectPath="/attendance"
      flowLabel="sign-in"
      googleRedirectPath="/attendance"
      googleCtaMode="default"
      submitCtaMode="inline"
      sendLabel={<ArrowRightIcon />}
      verifyLabel="Continue"
      links={[]}
      initialMessage={initialMessage}
    />
  );
}

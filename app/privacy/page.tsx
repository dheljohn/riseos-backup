export const metadata = {
  title: "Privacy Policy — RiseOS",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground text-sm mb-10">
          Effective date: June 2026
        </p>

        <Section title="1. What RiseOS Is">
          <P>
            RiseOS is a personal habit-tracking app that helps you log and
            review your sleep, meals, and focus sessions. It is a personal
            productivity tool — not a health service, and not a medical device.
          </P>
        </Section>

        <Section title="2. Data We Collect">
          <P>When you create an account, we collect:</P>
          <ul className="list-disc list-outside ml-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Your name and email address</li>
            <li>Your password (stored as a bcrypt hash — never in plain text)</li>
          </ul>
          <P className="mt-4">When you use the app, you can log:</P>
          <ul className="list-disc list-outside ml-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Sleep</strong> — duration in
              hours, self-reported energy level, and date
            </li>
            <li>
              <strong className="text-foreground">Meals</strong> — meal type
              (breakfast, lunch, dinner, snack), food name, optional calorie
              count, and date
            </li>
            <li>
              <strong className="text-foreground">Focus sessions</strong> — a
              label or goal you write, planned duration in minutes, completion
              status, and date
            </li>
          </ul>
          <P className="mt-4">We also collect technical data to operate the service:</P>
          <ul className="list-disc list-outside ml-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              IP address — used only for rate limiting (max 10 requests/min).
              Not stored in the database.
            </li>
            <li>
              Refresh tokens — short-lived cryptographic tokens stored in the
              database, used to keep you logged in. Rotated on every session
              renewal and deleted on logout.
            </li>
          </ul>
        </Section>

        <Section title="3. Data We Do NOT Collect">
          <ul className="list-disc list-outside ml-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Location data</li>
            <li>Device identifiers</li>
            <li>Biometric data</li>
            <li>Payment information</li>
            <li>Browsing history or analytics events</li>
            <li>Any data from third-party sources</li>
          </ul>
        </Section>

        <Section title="4. How We Use Your Data">
          <P>Your data is used exclusively to:</P>
          <ul className="list-disc list-outside ml-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Display your logs and history back to you</li>
            <li>
              Generate personalized weekly insights and streak tracking within
              the app
            </li>
            <li>Authenticate your account and maintain your session</li>
          </ul>
          <P className="mt-4">
            We do not use your data for advertising, profiling, or any purpose
            beyond operating the app for you.
          </P>
        </Section>

        <Section title="5. Data Sharing">
          <P>
            We do not sell, rent, or share your personal data with third
            parties. Your data is stored in a PostgreSQL database hosted on{" "}
            <span className="text-foreground font-medium">Neon</span> and the
            API is deployed on{" "}
            <span className="text-foreground font-medium">Vercel</span>. Both
            are infrastructure providers operating under their own privacy
            policies.
          </P>
        </Section>

        <Section title="6. Data Retention">
          <P>
            Your data is retained for as long as your account exists. If you
            delete your account, all associated records — logs, meal entries,
            focus sessions, and refresh tokens — are permanently deleted from
            the database via cascading deletion.
          </P>
        </Section>

        <Section title="7. Security">
          <P>
            Passwords are hashed using bcrypt with a cost factor of 12. Sessions
            are managed with short-lived JWT access tokens (15 minutes) and
            rotating refresh tokens (7 days). Tokens are stored on your device
            using the platform's encrypted secure storage.
          </P>
        </Section>

        <Section title="8. Children">
          <P>
            RiseOS is not directed at children under 13. We do not knowingly
            collect data from anyone under 13.
          </P>
        </Section>

        <Section title="9. Changes to This Policy">
          <P>
            If we make material changes to this policy, we will update the
            effective date above. Continued use of the app after changes
            constitutes acceptance of the updated policy.
          </P>
        </Section>

        <Section title="10. Contact">
          <P>
            Questions about this policy can be sent to the app developer
            directly through the app or the repository contact listed in the
            project README.
          </P>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-semibold mb-3 text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function P({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm text-muted-foreground leading-relaxed ${className ?? ""}`}>
      {children}
    </p>
  );
}

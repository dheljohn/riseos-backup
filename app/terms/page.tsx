export const metadata = {
  title: "Terms of Service — RiseOS",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-muted-foreground text-sm mb-10">
          Effective date: June 2026
        </p>

        <Section title="1. Acceptance">
          <P>
            By creating an account and using RiseOS, you agree to these terms.
            If you do not agree, do not use the app.
          </P>
        </Section>

        <Section title="2. What RiseOS Provides">
          <P>
            RiseOS is a personal habit-tracking tool. It lets you log sleep,
            meals, and focus sessions, and shows you summaries and streaks based
            on your own entries. It is a self-reporting tool — all data entered
            is entered by you, and insights are derived from that data only.
          </P>
          <P className="mt-3">
            RiseOS is not a medical device, health monitoring service, or
            clinical tool. Nothing in the app constitutes medical advice,
            nutritional advice, or any form of professional guidance.
          </P>
        </Section>

        <Section title="3. Your Account">
          <P>
            You are responsible for maintaining the confidentiality of your
            account credentials. You must provide a valid email address at
            registration. One account per person — creating multiple accounts is
            not permitted.
          </P>
          <P className="mt-3">
            You must be at least 13 years old to use RiseOS.
          </P>
        </Section>

        <Section title="4. Acceptable Use">
          <P>You agree not to:</P>
          <ul className="list-disc list-outside ml-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Attempt to access other users' accounts or data</li>
            <li>
              Probe, scan, or test the vulnerability of the API or
              infrastructure
            </li>
            <li>
              Submit automated requests in excess of normal usage (rate limits
              are enforced)
            </li>
            <li>Use the service for any unlawful purpose</li>
          </ul>
        </Section>

        <Section title="5. Your Data">
          <P>
            You own the data you enter. RiseOS does not claim any rights over
            your logs, notes, or personal information. See the{" "}
            <span className="text-foreground font-medium">Privacy Policy</span>{" "}
            for details on how data is stored and handled.
          </P>
          <P className="mt-3">
            You can delete your account and all associated data at any time by
            contacting the developer.
          </P>
        </Section>

        <Section title="6. No Warranties">
          <P>
            RiseOS is provided as-is. We make no guarantees about uptime,
            accuracy of insights, or fitness for any particular purpose. The app
            may be unavailable at times due to maintenance or infrastructure
            issues.
          </P>
        </Section>

        <Section title="7. Limitation of Liability">
          <P>
            To the maximum extent permitted by applicable law, the developer of
            RiseOS is not liable for any indirect, incidental, or consequential
            damages arising from your use of the app, including but not limited
            to data loss or decisions made based on app insights.
          </P>
        </Section>

        <Section title="8. Termination">
          <P>
            We reserve the right to suspend or delete accounts that violate
            these terms. You may stop using the app at any time.
          </P>
        </Section>

        <Section title="9. Changes to These Terms">
          <P>
            We may update these terms. The effective date at the top of this
            page will reflect the most recent revision. Continued use of RiseOS
            after changes means you accept the updated terms.
          </P>
        </Section>

        <Section title="10. Contact">
          <P>
            For questions about these terms, contact the developer through the
            app or the repository contact listed in the project README.
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

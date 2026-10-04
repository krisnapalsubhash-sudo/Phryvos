import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Phryvos',
  description: 'Terms of Service for Phryvos Social Platform',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Phryvos, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. User Conduct & Community Guidelines</h2>
            <p>
              You agree to use Phryvos respectfully and lawfully. Harassment, hate speech, spamming, illegal content,
              or impersonation of other individuals will result in immediate suspension or permanent termination of your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. User Content</h2>
            <p>
              You retain ownership of the content you post on Phryvos. However, by posting, you grant Phryvos a non-exclusive license to host, display, and distribute your content across our platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Termination</h2>
            <p>
              We reserve the right to suspend or terminate access to our service at our discretion, without prior notice, for conduct that violates these Terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Changes to Terms</h2>
            <p>
              We may revise these Terms from time to time. The most current version will always be available on this page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Phryvos',
  description: 'Privacy Policy for Phryvos Social Platform',
};

export default function PrivacyPage() {
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
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p>
              Welcome to Phryvos. We respect your privacy and are committed to protecting your personal data.
              This Privacy Policy explains how we collect, use, and safeguard your information when you use our web platform and mobile applications.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us when creating an account, updating your profile,
              and participating in chats or communities.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account credentials (username, email address, password hash)</li>
              <li>Profile data (avatar, bio, display name)</li>
              <li>User communications and posts</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>
              Your data is used solely to provide, maintain, and improve our services, facilitate connections and matchmaking,
              and enforce platform safety. We never sell your personal data to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Security & Data Protection</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS) and at rest to protect your information against unauthorized access.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact our support team at support@phryvos.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

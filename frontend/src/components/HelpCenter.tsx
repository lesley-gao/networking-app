import React from 'react';
import { Link } from 'react-router-dom';

const HELP_SECTIONS = [
  {
    index: 1,
    id: 'getting-started',
    title: 'Getting Started',
    content: (
      <>
        <p>Welcome to WingCompanion! To begin, <b>register</b> for an account, verify your email, and complete your profile. You can then search for flight companions or offer/seek pickup services.</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Sign up with your email or social account</li>
          <li>Verify your identity for added trust</li>
          <li>Set your language and notification preferences</li>
        </ul>
      </>
    )
  },
  {
    index: 2,
    id: 'account-management',
    title: 'Account Management',
    content: (
      <>
        <p>Manage your account settings from your profile page. You can update your information, change your password, or delete your account at any time.</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Update your profile photo and details</li>
          <li>Change your password or email address</li>
          <li>Enable two-factor authentication for extra security</li>
          <li>Delete your account (this is permanent)</li>
        </ul>
      </>
    )
  },
  {
    index: 3,
    id: 'using-services',
    title: 'Using Services',
    content: (
      <>
        <p>WingCompanion offers two main services: <b>Flight Companion Matching</b> and <b>Pickup Service</b>.</p>
        <ul className="list-disc pl-6 mt-2">
          <li>To find a flight companion, create a request with your travel details or browse available offers.</li>
          <li>To offer or request a pickup, use the Pickup Service section and fill out the relevant form.</li>
          <li>Communicate securely with other users via in-app messaging.</li>
        </ul>
      </>
    )
  },
  {
    index: 4,
    id: 'safety-security',
    title: 'Safety & Security',
    content: (
      <>
        <p>Your safety is our priority. Please follow these guidelines:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Always verify the identity of your companion or driver</li>
          <li>Meet in public places when possible</li>
          <li>Use the in-app Emergency Assistance feature if you feel unsafe</li>
          <li>Report any suspicious or inappropriate behavior</li>
        </ul>
        <p className="mt-2">For more, see our <Link to="/community-guidelines" className="text-blue-600 hover:underline">Community Guidelines</Link> and <Link to="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.</p>
      </>
    )
  },
  {
    index: 5,
    id: 'troubleshooting',
    title: 'Troubleshooting',
    content: (
      <>
        <p>If you encounter issues:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Try refreshing the page or restarting the app</li>
          <li>Check your internet connection</li>
          <li>Clear your browser cache or app data</li>
          <li>Ensure you have the latest version of the app</li>
        </ul>
        <p className="mt-2">If problems persist, contact our support team below.</p>
      </>
    )
  },
  {
    index: 6,
    id: 'contact-support',
    title: 'Contact Support',
    content: (
      <>
        <p>Need more help? Our support team is here for you:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Email: <a href="mailto:support@wingcompanion.com" className="text-blue-600 hover:underline">support@wingcompanion.com</a></li>
          <li>Phone: +64 21 123 4567</li>
          <li>Live chat: Available in the app during business hours</li>
        </ul>
      </>
    )
  }
];

const HelpCenter: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white dark:bg-gray-900">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of Contents */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-6 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Help Center</h3>
            <ul className="space-y-2 pl-0 list-none">
              {HELP_SECTIONS.map((item) => (
                <li key={item.id} className="cursor-pointer list-none">
                  <div
                    onClick={() => scrollToSection(item.id)}
                    className="text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors text-left block w-full"
                  >
                    {item.index}. {item.title}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Help Center</h1>
            <p className="text-gray-600 dark:text-gray-300">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {HELP_SECTIONS.map(({ id, title, content, index }) => (
              <section className="mb-8" id={id} key={id}>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{index}. {title}</h2>
                <div className="text-gray-700 dark:text-gray-300">{content}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter; 
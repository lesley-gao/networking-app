import React from 'react';
import { Link } from 'react-router-dom';

const FAQ_ENTRIES = [
  {
    index: 1,
    id: 'what-is-app',
    question: 'What is WingCompanion?',
    answer: 'WingCompanion is a platform that connects travelers for safer and more enjoyable journeys, offering flight companion matching and reliable airport pickup services.'
  },
  {
    index: 2,
    id: 'how-to-find-companion',
    question: 'How do I find a flight companion?',
    answer: 'Sign up, create a request with your flight details, and browse available companions. You can message and coordinate directly through the platform.'
  },
  {
    index: 3,
    id: 'is-my-data-safe',
    question: 'Is my personal information safe?',
    answer: 'Yes. We use industry-standard security practices to protect your data. See our Privacy Policy for details.'
  },
  {
    index: 4,
    id: 'how-to-offer-pickup',
    question: 'How can I offer a pickup service?',
    answer: 'Register as a driver, fill out your service details, and respond to pickup requests from travelers needing a ride.'
  },
  {
    index: 5,
    id: 'how-to-report-issue',
    question: 'How do I report a problem or dispute?',
    answer: 'Use the in-app reporting tools or contact our support team via the Help Center. We take all reports seriously and will investigate promptly.'
  },
  {
    index: 6,
    id: 'fees-payments',
    question: 'Are there any fees or payments involved?',
    answer: 'Some services may involve payments between users. All transactions are handled securely through our platform. See the Terms of Service for more.'
  },
  {
    index: 7,
    id: 'emergency-help',
    question: 'What should I do in an emergency?',
    answer: 'Use the Emergency Assistance feature in the app for immediate help, or contact local authorities if you are in danger.'
  },
  {
    index: 8,
    id: 'can-i-change-language',
    question: 'Can I use the app in different languages?',
    answer: 'Yes, you can switch languages in your profile or via the language selector in the navigation bar.'
  },
  {
    index: 9,
    id: 'how-to-delete-account',
    question: 'How do I delete my account?',
    answer: 'Go to your profile settings and select the option to delete your account. This will permanently remove your data from our system.'
  },
  {
    index: 10,
    id: 'contact-support',
    question: 'How do I contact support?',
    answer: 'Visit the Help Center or email support@wingcompanion.com for assistance.'
  }
];

const FAQ: React.FC = () => {
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
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of Contents */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-6 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-300">Table of Contents</h3>
            <ul className="space-y-2 pl-0 list-none">
              {FAQ_ENTRIES.map((item, index) => (
                <li key={item.id} className="cursor-pointer list-none">
                  <div
                    onClick={() => scrollToSection(item.id)}
                    className="text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors text-left block w-full"
                  >
                    {index + 1}. {item.question}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-300 mb-4">Frequently Asked Questions (FAQ)</h1>
            <p className="text-gray-600 dark:text-gray-300">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {FAQ_ENTRIES.map(({ id, question, answer, index }) => (
              <section className="mb-8" id={id} key={id}>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-300 mb-4">{index}. {question}</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{answer}</p>
                {id === 'is-my-data-safe' && (
                  <Link to="/privacy-policy" className="text-blue-600 hover:underline">Read our Privacy Policy</Link>
                )}
                {id === 'fees-payments' && (
                  <Link to="/terms-of-service" className="text-blue-600 hover:underline">See Terms of Service</Link>
                )}
                {id === 'how-to-report-issue' && (
                  <Link to="/help" className="text-blue-600 hover:underline">Go to Help Center</Link>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 
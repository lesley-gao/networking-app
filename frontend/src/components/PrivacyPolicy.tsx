import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const tableOfContents = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'information-we-collect', title: 'Information We Collect' },
    { id: 'how-we-use', title: 'How We Use Your Information' },
    { id: 'information-sharing', title: 'Information Sharing and Disclosure' },
    { id: 'data-security', title: 'Data Security' },
    { id: 'privacy-rights', title: 'Your Privacy Rights' },
    { id: 'data-retention', title: 'Data Retention' },
    { id: 'international-transfers', title: 'International Data Transfers' },
    { id: 'children-privacy', title: 'Children\'s Privacy' },
    { id: 'third-party-services', title: 'Third-Party Services' },
    { id: 'policy-changes', title: 'Changes to This Privacy Policy' },
    { id: 'contact-us', title: 'Contact Us' },
    { id: 'regional-rights', title: 'Regional Privacy Rights' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of Contents */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-6 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Table of Contents</h3>
                          <ul className="space-y-2 pl-0 list-none">
              {tableOfContents.map((item, index) => (
                <li key={item.id} className="cursor-pointer list-none">
                  <div
                    onClick={() => scrollToSection(item.id)}
                    className=" text-gray-700 hover:text-blue-600 transition-colors text-left block w-full"
                  >
                    {index + 1}. {item.title}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600">Last updated: {lastUpdated}</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8" id="introduction">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
                            Welcome to WingCompanion ("Service", "Platform", "we", "us", or "our"). 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
            our mobile application and web platform that connects travelers for flight companionship, pickup services, 
            and emergency assistance.
          </p>
          <p className="text-gray-700">
            By using our Service, you agree to the collection and use of information in accordance with this policy. 
            We are committed to protecting your privacy and ensuring the security of your personal information.
          </p>
        </section>

        <section className="mb-8" id="information-we-collect">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Personal Information</h3>
          <p className="text-gray-700 mb-4">When you create an account, we collect:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Full name and contact information (email, phone number)</li>
            <li>Profile photo and verification documents</li>
            <li>Date of birth and gender</li>
            <li>Government-issued ID for verification purposes</li>
            <li>Emergency contact information</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Travel and Location Information</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Flight details (dates, times, airports, flight numbers)</li>
            <li>Current location and destination preferences</li>
            <li>Real-time location data (when emergency features are activated)</li>
            <li>Travel preferences and companion requirements</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Payment Information</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Credit card and payment method details (processed securely through Stripe)</li>
            <li>Billing address and payment history</li>
            <li>Transaction records and receipts</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">2.4 Communication Data</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Messages exchanged through our platform</li>
            <li>Ratings and reviews provided</li>
            <li>Customer support communications</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">2.5 Technical Information</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Device information (device type, operating system, browser type)</li>
            <li>IP address and geolocation data</li>
            <li>Usage analytics and app interaction data</li>
            <li>Log files and error reports</li>
          </ul>
        </section>

        <section className="mb-8" id="how-we-use">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
          
          <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Core Service Functions</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Match you with compatible flight companions and pickup services</li>
            <li>Facilitate secure communication between users</li>
            <li>Process payments and manage escrow services</li>
            <li>Verify user identity and ensure platform safety</li>
            <li>Provide emergency assistance and location sharing</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Safety and Security</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Conduct background checks and identity verification</li>
            <li>Monitor for fraudulent or suspicious activity</li>
            <li>Investigate disputes and safety incidents</li>
            <li>Maintain platform integrity and user safety</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Service Improvement</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Analyze usage patterns to improve our matching algorithms</li>
            <li>Develop new features and enhance user experience</li>
            <li>Conduct research and analytics for service optimization</li>
            <li>Provide personalized recommendations</li>
          </ul>
        </section>

        <section className="mb-8" id="information-sharing">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
          
          <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 With Other Users</h3>
          <p className="text-gray-700 mb-4">
            We share limited profile information with matched users to facilitate connections. 
            This includes your name, profile photo, verified status, and relevant travel details.
          </p>

          <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Service Providers</h3>
          <p className="text-gray-700 mb-4">We may share information with trusted third parties who assist us in:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Payment processing (Stripe)</li>
            <li>Identity verification services</li>
            <li>Cloud hosting and data storage (Microsoft Azure)</li>
            <li>Email and notification services</li>
            <li>Analytics and performance monitoring</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Legal Requirements</h3>
          <p className="text-gray-700 mb-4">We may disclose information when required by law or to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Comply with legal processes and law enforcement requests</li>
            <li>Protect the rights, property, or safety of our users</li>
            <li>Investigate potential violations of our terms of service</li>
            <li>Respond to emergency situations</li>
          </ul>
        </section>

        <section className="mb-8" id="data-security">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement industry-standard security measures to protect your information:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>End-to-end encryption for sensitive communications</li>
            <li>Secure data transmission using TLS/SSL protocols</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Secure cloud infrastructure with Microsoft Azure</li>
            <li>Multi-factor authentication options</li>
            <li>Data minimization and retention policies</li>
          </ul>
          <p className="text-gray-700">
            While we strive to protect your personal information, no method of transmission over the internet 
            or electronic storage is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-8" id="privacy-rights">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Privacy Rights</h2>
          
          <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Access and Control</h3>
          <p className="text-gray-700 mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Access and review your personal information</li>
            <li>Update or correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Export your data in a portable format</li>
            <li>Control privacy settings and data sharing preferences</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Location Services</h3>
          <p className="text-gray-700 mb-4">
            You can control location sharing through your device settings. Note that disabling location 
            services may limit certain features, including emergency assistance and matching accuracy.
          </p>

          <h3 className="text-xl font-medium text-gray-800 mb-3">6.3 Marketing Communications</h3>
          <p className="text-gray-700 mb-4">
            You can opt out of promotional emails and push notifications at any time through your 
            account settings or by following the unsubscribe links in our communications.
          </p>
        </section>

        <section className="mb-8" id="data-retention">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We retain your information for as long as necessary to provide our services and comply with 
            legal obligations:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Account information: Until account deletion plus 30 days</li>
            <li>Transaction records: 7 years for financial compliance</li>
            <li>Safety incidents: 5 years or as required by law</li>
            <li>Marketing data: Until opt-out or account deletion</li>
            <li>Technical logs: 90 days for security and debugging</li>
          </ul>
        </section>

        <section className="mb-8" id="international-transfers">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h2>
          <p className="text-gray-700 mb-4">
            Your information may be transferred to and processed in countries other than your country of 
            residence. We ensure appropriate safeguards are in place to protect your information in 
            accordance with this Privacy Policy and applicable laws.
          </p>
        </section>

        <section className="mb-8" id="children-privacy">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
          <p className="text-gray-700 mb-4">
            Our Service is not intended for users under the age of 18. We do not knowingly collect 
            personal information from children under 18. If we become aware that we have collected 
            personal information from a child under 18, we will take steps to delete such information.
          </p>
        </section>

        <section className="mb-8" id="third-party-services">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Services</h2>
          <p className="text-gray-700 mb-4">
            Our Service may contain links to third-party websites or integrate with third-party services. 
            We are not responsible for the privacy practices of these third parties. We encourage you to 
            review their privacy policies before providing any information.
          </p>
        </section>

        <section className="mb-8" id="policy-changes">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new Privacy Policy on this page and updating the "Last updated" date. 
            We encourage you to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section className="mb-8" id="contact-us">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy or our privacy practices, please contact us:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@flightcompanion.com</p>
            <p className="text-gray-700 mb-2"><strong>Address:</strong> [Your Company Address]</p>
            <p className="text-gray-700"><strong>Phone:</strong> [Your Contact Number]</p>
          </div>
        </section>

        <section className="mb-8" id="regional-rights">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Regional Privacy Rights</h2>
          
          <h3 className="text-xl font-medium text-gray-800 mb-3">13.1 GDPR (European Union)</h3>
          <p className="text-gray-700 mb-4">
            If you are located in the EU, you have additional rights under the General Data Protection 
            Regulation (GDPR), including the right to object to processing, data portability, and the 
            right to file a complaint with your local data protection authority.
          </p>

          <h3 className="text-xl font-medium text-gray-800 mb-3">13.2 CCPA (California)</h3>
          <p className="text-gray-700 mb-4">
            California residents have specific rights under the California Consumer Privacy Act (CCPA), 
            including the right to know what personal information is collected, the right to delete 
            personal information, and the right to opt-out of the sale of personal information.
          </p>
        </section>

        <div className="border-t pt-8 mt-8">
          <p className="text-sm text-gray-500">
            This Privacy Policy is part of our Terms of Service and should be read in conjunction with our{' '}
            <Link 
              to="/community-guidelines" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Community Guidelines
            </Link>
            {' '}and{' '}
            <Link 
              to="/terms-of-service" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 
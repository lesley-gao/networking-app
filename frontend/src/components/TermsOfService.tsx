import React from 'react';
import { useTranslation } from 'react-i18next';

const TermsOfService: React.FC = () => {
  const { t, i18n } = useTranslation();
  
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
    { id: 'acceptance', title: 'Acceptance of Terms' },
    { id: 'description', title: 'Service Description' },
    { id: 'eligibility', title: 'User Eligibility' },
    { id: 'accounts', title: 'User Accounts and Registration' },
    { id: 'conduct', title: 'User Conduct and Responsibilities' },
    { id: 'payments', title: 'Payment Terms and Conditions' },
    { id: 'liability', title: 'Limitation of Liability' },
    { id: 'privacy', title: 'Privacy and Data Protection' },
    { id: 'termination', title: 'Termination of Service' },
    { id: 'changes', title: 'Modifications to Terms' },
    { id: 'governing', title: 'Governing Law' },
    { id: 'contact', title: 'Contact Information' }
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
                    className="text-gray-700 hover:text-blue-600 transition-colors text-left block w-full"
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-gray-600">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8" id="acceptance">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using WingCompanion ("Service", "Platform", "we", "us", or "our"), 
                you accept and agree to be bound by the terms and provision of this agreement.
              </p>
              <p className="text-gray-700">
                If you do not agree to abide by the above, please do not use this service. These Terms of Service, 
                together with our Privacy Policy, constitute the entire agreement between you and our Platform.
              </p>
            </section>

            <section className="mb-8" id="description">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                WingCompanion provides a comprehensive travel companion service that includes:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Flight companion matching for solo travelers</li>
                <li>Airport pickup and drop-off services</li>
                <li>Emergency assistance and safety features</li>
                <li>Secure payment processing and escrow services</li>
                <li>User verification and safety screening</li>
                <li>Real-time communication and location sharing</li>
              </ul>
              <p className="text-gray-700">
                The Platform serves as an intermediary connecting travelers with compatible companions and service providers, 
                facilitating safe and reliable travel experiences.
              </p>
            </section>

            <section className="mb-8" id="eligibility">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Eligibility</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Age Requirements</h3>
              <p className="text-gray-700 mb-4">
                You must be at least 18 years old to use our Service. Users under 18 may use the Service only 
                with the involvement and consent of a parent or guardian.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Identity Verification</h3>
              <p className="text-gray-700 mb-4">
                All users must complete our identity verification process, which includes:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Government-issued photo identification</li>
                <li>Phone number verification</li>
                <li>Email address confirmation</li>
                <li>Background check (where legally permitted)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Legal Compliance</h3>
              <p className="text-gray-700">
                You must comply with all applicable local, state, national, and international laws and regulations 
                while using our Service.
              </p>
            </section>

            <section className="mb-8" id="accounts">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Account Creation</h3>
              <p className="text-gray-700 mb-4">
                To access our Service, you must create an account by providing accurate and complete information. 
                You are responsible for safeguarding your account credentials and for all activities that occur under your account.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Account Responsibilities</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Maintain accurate and up-to-date profile information</li>
                <li>Use a secure password and enable two-factor authentication when available</li>
                <li>Immediately notify us of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Account Suspension</h3>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate accounts that violate these Terms of Service, 
                engage in fraudulent activity, or pose a safety risk to other users.
              </p>
            </section>

            <section className="mb-8" id="conduct">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Conduct and Responsibilities</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Prohibited Activities</h3>
              <p className="text-gray-700 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Harass, threaten, or discriminate against other users</li>
                <li>Share false, misleading, or fraudulent information</li>
                <li>Engage in any activity that compromises platform security</li>
                <li>Use the platform for commercial purposes without authorization</li>
                <li>Attempt to circumvent our safety measures or verification processes</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Safety Guidelines</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Always meet in public places when possible</li>
                <li>Inform friends or family about your travel plans</li>
                <li>Trust your instincts and report suspicious behavior</li>
                <li>Use the platform's communication tools for initial contact</li>
                <li>Verify companion identity before meeting</li>
              </ul>
            </section>

            <section className="mb-8" id="payments">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment Terms and Conditions</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Payment Processing</h3>
              <p className="text-gray-700 mb-4">
                All payments are processed securely through our third-party payment processor (Stripe). 
                We use an escrow system to ensure safe transactions between users.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Service Fees</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Platform service fee: 5% of transaction value</li>
                <li>Payment processing fee: As determined by payment processor</li>
                <li>Emergency service fee: Fixed rate per incident</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.3 Refund Policy</h3>
              <p className="text-gray-700">
                Refunds are processed according to our refund policy and may vary based on the timing of cancellation 
                and circumstances. Emergency cancellations may be eligible for full refunds.
              </p>
            </section>

            <section className="mb-8" id="liability">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                While we strive to provide a safe and reliable platform, we cannot guarantee the conduct of users 
                or the quality of services provided. Our liability is limited to the maximum extent permitted by law.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>We are not liable for the actions or omissions of platform users</li>
                <li>We do not guarantee the safety or quality of transportation services</li>
                <li>Our maximum liability shall not exceed the fees paid by you in the 12 months preceding the claim</li>
                <li>We are not responsible for indirect, incidental, or consequential damages</li>
              </ul>
            </section>

            <section className="mb-8" id="privacy">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection, use, and protection of your personal information 
                is governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>
              <p className="text-gray-700">
                By using our Service, you consent to the collection and use of your information as outlined 
                in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8" id="termination">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination of Service</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">9.1 Termination by User</h3>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time by contacting our customer support team. 
                Upon termination, your access to the Service will be immediately suspended.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">9.2 Termination by Platform</h3>
              <p className="text-gray-700">
                We may terminate or suspend your account immediately, without prior notice or liability, 
                for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section className="mb-8" id="changes">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modifications to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will try to provide at least 30 days' notice prior to any new terms taking effect.
              </p>
              <p className="text-gray-700">
                Your continued use of the Service after any changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8" id="governing">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be interpreted and governed by the laws of New Zealand, without regard to its 
                conflict of law provisions. Any disputes arising from these Terms shall be resolved in the 
                courts of New Zealand.
              </p>
            </section>

            <section className="mb-8" id="contact">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Email: legal@wingcompanion.com</li>
                <li>Phone: +64 9 123 4567</li>
                <li>Address: 123 Queen Street, Auckland, New Zealand</li>
                <li>Support Portal: Available 24/7 through our mobile app</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
// frontend/src/components/CommunityGuidelines.tsx
import React from 'react';

const CommunityGuidelines: React.FC = () => {
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
    { id: 'overview', title: 'Community Overview' },
    { id: 'conduct', title: 'Code of Conduct' },
    { id: 'safety', title: 'Safety Guidelines' },
    { id: 'services', title: 'Service Standards' },
    { id: 'reporting', title: 'Reporting and Enforcement' },
    { id: 'consequences', title: 'Consequences of Violations' }
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Guidelines</h1>
            <p className="text-gray-600">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8" id="overview">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Community Overview</h2>
              <p className="text-gray-700 mb-4">
                Welcome to the WingCompanion community! Our platform connects travelers 
                worldwide, fostering safe, reliable, and enjoyable travel experiences through companion matching, 
                pickup services, and emergency assistance.
              </p>
              <p className="text-gray-700 mb-4">
                These Community Guidelines establish the standards of behavior expected from all platform users. 
                By joining our community, you agree to uphold these values and contribute to a positive, 
                safe environment for all travelers.
              </p>
              <p className="text-gray-700">
                Our community thrives on mutual respect, trust, and safety. Together, we create memorable 
                travel experiences while ensuring everyone feels secure and valued.
              </p>
            </section>

            <section className="mb-8" id="conduct">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Code of Conduct</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Respectful Communication</h3>
              <p className="text-gray-700 mb-4">
                Treat all community members with dignity and respect. Our platform welcomes users from diverse 
                backgrounds, cultures, and experiences. We expect all interactions to be courteous, professional, 
                and considerate.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Use polite and professional language in all communications</li>
                <li>Respond promptly to messages and booking requests</li>
                <li>Be patient and understanding with fellow travelers</li>
                <li>Respect cultural differences and personal boundaries</li>
                <li>Maintain constructive dialogue even during disagreements</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Zero Tolerance for Discrimination</h3>
              <p className="text-gray-700 mb-4">
                Discrimination of any kind is strictly prohibited on our platform. We do not tolerate harassment, 
                hate speech, or discriminatory behavior based on:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Race, ethnicity, or national origin</li>
                <li>Religion or personal beliefs</li>
                <li>Gender, gender identity, or sexual orientation</li>
                <li>Age, disability, or health status</li>
                <li>Economic status or profession</li>
                <li>Political views or affiliations</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Harassment Prevention</h3>
              <p className="text-gray-700 mb-4">
                Harassment in any form is unacceptable. This includes but is not limited to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Unwelcome sexual advances or inappropriate comments</li>
                <li>Persistent unwanted contact or stalking behavior</li>
                <li>Threats, intimidation, or aggressive behavior</li>
                <li>Sharing personal information without consent</li>
                <li>Creating fake profiles or impersonating others</li>
              </ul>
            </section>

            <section className="mb-8" id="safety">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Safety Guidelines</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Identity Verification</h3>
              <p className="text-gray-700 mb-4">
                Complete identity verification is mandatory for all users. This process helps ensure platform 
                safety and builds trust within our community.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Upload a clear government-issued photo ID</li>
                <li>Verify your phone number and email address</li>
                <li>Use recent, genuine photos in your profile</li>
                <li>Keep your profile information current and accurate</li>
                <li>Complete additional verification steps when requested</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Safe Meeting Practices</h3>
              <p className="text-gray-700 mb-4">
                Your safety is our top priority. Follow these guidelines when meeting fellow travelers:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Meet in public, well-lit areas with good foot traffic</li>
                <li>Inform trusted friends or family about your travel plans</li>
                <li>Trust your instincts – if something feels wrong, prioritize your safety</li>
                <li>Use our in-app communication tools for initial contact</li>
                <li>Verify companion identity before meeting in person</li>
                <li>Keep your phone charged and emergency contacts readily available</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Personal Information Protection</h3>
              <p className="text-gray-700 mb-4">
                Protect your personal information and respect others' privacy:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Don't share sensitive personal information until you feel comfortable</li>
                <li>Use the platform's messaging system for initial communications</li>
                <li>Be cautious about sharing home addresses or workplace information</li>
                <li>Report users who request inappropriate personal information</li>
                <li>Respect others' privacy preferences and boundaries</li>
              </ul>
            </section>

            <section className="mb-8" id="services">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Service Standards</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Reliability and Commitment</h3>
              <p className="text-gray-700 mb-4">
                Honor your commitments and maintain reliability to ensure positive experiences for all users:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Arrive on time for all scheduled meetings and pickups</li>
                <li>Provide advance notice if plans change or cancellation is necessary</li>
                <li>Be prepared and bring agreed-upon items or documents</li>
                <li>Follow through on agreed arrangements and pricing</li>
                <li>Communicate proactively about any delays or issues</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Payment and Financial Conduct</h3>
              <p className="text-gray-700 mb-4">
                Maintain transparency and honesty in all financial transactions:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Use only the platform's secure payment system</li>
                <li>Be clear about pricing and any additional costs</li>
                <li>Don't request or offer payments outside the platform</li>
                <li>Report any attempts at payment fraud or manipulation</li>
                <li>Respect the escrow system and dispute resolution process</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Service Quality Standards</h3>
              <p className="text-gray-700 mb-4">
                Provide high-quality services that meet or exceed expectations:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Maintain clean, safe, and reliable transportation when offering pickup services</li>
                <li>Be helpful, courteous, and professional at all times</li>
                <li>Provide accurate descriptions of services offered</li>
                <li>Address any issues or concerns promptly and professionally</li>
                <li>Continuously strive to improve the user experience</li>
              </ul>
            </section>

            <section className="mb-8" id="reporting">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Reporting and Enforcement</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Reporting Violations</h3>
              <p className="text-gray-700 mb-4">
                Help us maintain a safe community by reporting violations of these guidelines:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Use the in-app reporting feature to flag inappropriate behavior</li>
                <li>Provide detailed information about the incident</li>
                <li>Include screenshots or evidence when possible</li>
                <li>Report immediately for safety-related concerns</li>
                <li>Contact emergency services for immediate threats or danger</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Investigation Process</h3>
              <p className="text-gray-700 mb-4">
                We take all reports seriously and investigate them thoroughly:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>All reports are reviewed within 24 hours</li>
                <li>Both parties may be contacted for additional information</li>
                <li>Evidence is carefully evaluated by our safety team</li>
                <li>Decisions are made based on platform policies and user safety</li>
                <li>Updates are provided to reporting users when appropriate</li>
              </ul>
            </section>

            <section className="mb-8" id="consequences">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Consequences of Violations</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Warning System</h3>
              <p className="text-gray-700 mb-4">
                Minor violations may result in warnings and educational resources:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>First-time minor offenses receive educational warnings</li>
                <li>Guidance provided on appropriate platform behavior</li>
                <li>Opportunity for users to correct behavior</li>
                <li>Tracking of warning history for pattern identification</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Account Restrictions</h3>
              <p className="text-gray-700 mb-4">
                Serious or repeated violations may result in account limitations:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Temporary suspension of messaging or booking features</li>
                <li>Reduced profile visibility in search results</li>
                <li>Mandatory completion of safety education modules</li>
                <li>Extended verification requirements</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.3 Account Termination</h3>
              <p className="text-gray-700 mb-4">
                Severe violations result in immediate and permanent account termination:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Harassment, discrimination, or threatening behavior</li>
                <li>Fraud, scams, or payment manipulation</li>
                <li>Creating fake profiles or identity misrepresentation</li>
                <li>Repeated violations after multiple warnings</li>
                <li>Any illegal activity or safety violations</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.4 Appeals Process</h3>
              <p className="text-gray-700">
                Users may appeal enforcement decisions through our formal appeals process. 
                Appeals are reviewed by a separate team and decided based on additional evidence 
                and circumstances. Users have 30 days from the enforcement action to submit an appeal.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelines;

import React from 'react';
import { Link } from 'react-router-dom';

const CookiePolicy: React.FC = () => {
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
    { id: 'what-are-cookies', title: 'What Are Cookies' },
    { id: 'types-of-cookies', title: 'Types of Cookies We Use' },
    { id: 'how-we-use-cookies', title: 'How We Use Cookies' },
    { id: 'third-party-cookies', title: 'Third-Party Cookies' },
    { id: 'cookie-categories', title: 'Cookie Categories' },
    { id: 'managing-cookies', title: 'Managing Your Cookie Preferences' },
    { id: 'browser-settings', title: 'Browser Settings' },
    { id: 'mobile-settings', title: 'Mobile App Settings' },
    { id: 'cookie-retention', title: 'Cookie Retention' },
    { id: 'updates', title: 'Updates to This Policy' },
    { id: 'contact', title: 'Contact Us' }
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
            <p className="text-gray-600">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8" id="introduction">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                This Cookie Policy explains how WingCompanion ("we", "us", "our") 
                uses cookies and similar tracking technologies when you visit our website or use our mobile application.
              </p>
              <p className="text-gray-700 mb-4">
                This policy should be read in conjunction with our{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-800 underline">
                  Terms of Service
                </Link>.
              </p>
              <p className="text-gray-700">
                By continuing to use our platform, you consent to our use of cookies as described in this policy.
              </p>
            </section>

            <section className="mb-8" id="what-are-cookies">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. What Are Cookies</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you 
                visit a website or use an application. They contain information that can be read by the website or 
                app on subsequent visits.
              </p>
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Similar Technologies</h3>
              <p className="text-gray-700 mb-4">We also use similar technologies including:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Local Storage:</strong> Stores data locally within your browser</li>
                <li><strong>Session Storage:</strong> Temporarily stores data for your current session</li>
                <li><strong>Web Beacons:</strong> Small images that help us analyze user behavior</li>
                <li><strong>SDKs:</strong> Software development kits in our mobile app that collect analytics</li>
                <li><strong>Pixels:</strong> Tracking pixels from third-party services</li>
              </ul>
            </section>

            <section className="mb-8" id="types-of-cookies">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 First-Party Cookies</h3>
              <p className="text-gray-700 mb-4">
                These are cookies set directly by our platform. They are essential for providing our services 
                and enhancing your user experience.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Third-Party Cookies</h3>
              <p className="text-gray-700 mb-4">
                These are cookies set by external services we use to enhance functionality:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Google Analytics:</strong> For website and app analytics</li>
                <li><strong>Stripe:</strong> For secure payment processing</li>
                <li><strong>Microsoft Azure:</strong> For cloud services and performance monitoring</li>
                <li><strong>Social Media Platforms:</strong> For social sharing and login functionality</li>
                <li><strong>Customer Support:</strong> For chat and support features</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Session vs Persistent Cookies</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser or app</li>
                <li><strong>Persistent Cookies:</strong> Remain on your device for a specified period or until manually deleted</li>
              </ul>
            </section>

            <section className="mb-8" id="how-we-use-cookies">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Use Cookies</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Authentication and Security</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Keep you logged in during your session</li>
                <li>Remember your authentication status</li>
                <li>Detect and prevent fraudulent activity</li>
                <li>Enhance platform security measures</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Functionality and Preferences</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Remember your language and region preferences</li>
                <li>Store your search filters and travel preferences</li>
                <li>Maintain your privacy and notification settings</li>
                <li>Remember your dark/light mode preference</li>
                <li>Save items in your favorites or wishlist</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Performance and Analytics</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Analyze how you use our platform</li>
                <li>Monitor platform performance and load times</li>
                <li>Identify and fix technical issues</li>
                <li>Understand user behavior patterns</li>
                <li>Improve our matching algorithms</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.4 Personalization</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Provide personalized flight companion recommendations</li>
                <li>Show relevant pickup services in your area</li>
                <li>Customize content based on your travel history</li>
                <li>Display targeted safety tips and travel advice</li>
              </ul>
            </section>

            <section className="mb-8" id="third-party-cookies">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party Cookies</h2>
              <p className="text-gray-700 mb-4">
                We work with trusted third-party service providers who may set cookies on our behalf. 
                These partners have their own cookie policies:
              </p>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Analytics and Performance</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>
                  <strong>Google Analytics:</strong> Provides detailed usage analytics and user behavior insights
                  <br />
                  <span className="text-sm text-gray-600">
                    Privacy Policy: <a href="https://policies.google.com/privacy" className="text-blue-600 hover:text-blue-800">
                      https://policies.google.com/privacy
                    </a>
                  </span>
                </li>
                <li>
                  <strong>Microsoft Application Insights:</strong> Monitors app performance and crashes
                  <br />
                  <span className="text-sm text-gray-600">
                    Privacy Policy: <a href="https://privacy.microsoft.com" className="text-blue-600 hover:text-blue-800">
                      https://privacy.microsoft.com
                    </a>
                  </span>
                </li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Payment Processing</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>
                  <strong>Stripe:</strong> Secure payment processing and fraud detection
                  <br />
                  <span className="text-sm text-gray-600">
                    Privacy Policy: <a href="https://stripe.com/privacy" className="text-blue-600 hover:text-blue-800">
                      https://stripe.com/privacy
                    </a>
                  </span>
                </li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.3 Communication and Support</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Customer support chat widgets</li>
                <li>Email marketing and communication tools</li>
                <li>Push notification services</li>
              </ul>
            </section>

            <section className="mb-8" id="cookie-categories">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookie Categories</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Strictly Necessary Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies are essential for the platform to function properly. They cannot be disabled.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Authentication and login management</li>
                <li>Security and fraud prevention</li>
                <li>Session management</li>
                <li>Load balancing and platform stability</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Functional Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies enable enhanced functionality and personalization.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>User preferences and settings</li>
                <li>Language and region selection</li>
                <li>Search filters and travel preferences</li>
                <li>Accessibility features</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.3 Analytics Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies help us understand how users interact with our platform.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Usage statistics and behavior analysis</li>
                <li>Performance monitoring</li>
                <li>Feature usage tracking</li>
                <li>Error and crash reporting</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.4 Marketing Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies are used to deliver relevant advertisements and marketing content.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Personalized content recommendations</li>
                <li>Email marketing optimization</li>
                <li>Social media integration</li>
                <li>Retargeting and remarketing campaigns</li>
              </ul>
            </section>

            <section className="mb-8" id="managing-cookies">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Managing Your Cookie Preferences</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Cookie Consent Manager</h3>
              <p className="text-gray-700 mb-4">
                When you first visit our platform, you'll see a cookie consent banner allowing you to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Accept all cookies</li>
                <li>Reject optional cookies</li>
                <li>Customize your cookie preferences by category</li>
                <li>Access detailed information about each cookie type</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Changing Your Preferences</h3>
              <p className="text-gray-700 mb-4">
                You can modify your cookie preferences at any time by:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Visiting your account settings page</li>
                <li>Clicking the "Cookie Preferences" link in the footer</li>
                <li>Using the cookie settings panel in our mobile app</li>
                <li>Contacting our support team for assistance</li>
              </ul>
            </section>

            <section className="mb-8" id="browser-settings">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Browser Settings</h2>
              <p className="text-gray-700 mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Block cookies entirely</li>
                <li>Block third-party cookies only</li>
                <li>Delete existing cookies</li>
                <li>Set notifications when cookies are being set</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.1 Browser-Specific Instructions</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>
                  <strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data
                </li>
                <li>
                  <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
                </li>
                <li>
                  <strong>Safari:</strong> Preferences → Privacy → Cookies and website data
                </li>
                <li>
                  <strong>Edge:</strong> Settings → Site permissions → Cookies and site data
                </li>
              </ul>

              <p className="text-gray-700">
                <strong>Note:</strong> Disabling cookies may affect the functionality of our platform and your user experience.
              </p>
            </section>

            <section className="mb-8" id="mobile-settings">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Mobile App Settings</h2>
              <p className="text-gray-700 mb-4">
                Our mobile app uses similar technologies to cookies. You can manage these settings through:
              </p>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">9.1 In-App Settings</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Open the app and go to Settings → Privacy</li>
                <li>Toggle analytics and marketing preferences</li>
                <li>Manage location data sharing</li>
                <li>Control push notification settings</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">9.2 Device Settings</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>iOS:</strong> Settings → Privacy & Security → Analytics & Improvements</li>
                <li><strong>Android:</strong> Settings → Privacy → Ads → Reset advertising ID</li>
              </ul>
            </section>

            <section className="mb-8" id="cookie-retention">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookie Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain cookies for different periods depending on their purpose:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Session cookies:</strong> Deleted when you close your browser/app</li>
                <li><strong>Authentication cookies:</strong> 30 days or until logout</li>
                <li><strong>Preference cookies:</strong> 1 year</li>
                <li><strong>Analytics cookies:</strong> 2 years</li>
                <li><strong>Marketing cookies:</strong> 13 months</li>
              </ul>
            </section>

            <section className="mb-8" id="updates">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Updates to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices or legal requirements. 
                When we make significant changes, we will:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Update the "Last updated" date at the top of this policy</li>
                <li>Notify you through our platform or via email</li>
                <li>Request renewed consent where required by law</li>
                <li>Provide a summary of key changes</li>
              </ul>
            </section>

            <section className="mb-8" id="contact">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Cookie Policy or our cookie practices, please contact us:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Email: privacy@wingcompanion.com</li>
                <li>Phone: +64 9 123 4567</li>
                <li>Address: 123 Queen Street, Auckland, New Zealand</li>
                <li>
                  Data Protection Officer: dpo@wingcompanion.com
                </li>
                <li>
                  Cookie Preferences: Accessible through your account settings or{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                    Cookie Settings
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy; 
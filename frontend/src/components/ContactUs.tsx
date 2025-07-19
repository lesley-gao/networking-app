import React from "react";

const CONTACT_SECTIONS = [
  {
    index: 1,
    id: "general-inquiries",
    title: "General Inquiries",
    content: (
      <>
        <p>
          For general questions about WingCompanion, our services, or your
          account, please reach out to us via email or phone. We aim to respond
          within 1-2 business days.
        </p>
        <ul className="list-disc pl-6 mt-2">
          <li>
            Email:{" "}
            <a
              href="mailto:info@wingcompanion.com"
              className="text-blue-600 hover:underline"
            >
              info@wingcompanion.com
            </a>
          </li>
          <li>Phone: +64 21 123 4567</li>
        </ul>
      </>
    ),
  },
  {
    index: 2,
    id: "support",
    title: "Support",
    content: (
      <>
        <p>
          If you need help with your account, have technical issues, or want to
          report a problem, our support team is here for you.
        </p>
        <ul className="list-disc pl-6 mt-2">
          <li>
            Email:{" "}
            <a
              href="mailto:support@wingcompanion.com"
              className="text-blue-600 hover:underline"
            >
              support@wingcompanion.com
            </a>
          </li>
          <li>Live chat: Available in the app during business hours</li>
        </ul>
      </>
    ),
  },
  {
    index: 3,
    id: "media-partnerships",
    title: "Media & Partnerships",
    content: (
      <>
        <p>
          For media inquiries, press releases, or partnership opportunities,
          please contact our business development team.
        </p>
        <ul className="list-disc pl-6 mt-2">
          <li>
            Email:{" "}
            <a
              href="mailto:media@wingcompanion.com"
              className="text-blue-600 hover:underline"
            >
              media@wingcompanion.com
            </a>
          </li>
        </ul>
      </>
    ),
  },
  {
    index: 4,
    id: "office-location",
    title: "Office Location",
    content: (
      <>
        <p>
          Our main office is located in Auckland, New Zealand. Visits are by
          appointment only.
        </p>
        <ul className="list-disc pl-6 mt-2">
          <li>Address: 123 Queen Street, Auckland, New Zealand</li>
          <li>Phone: +64 21 123 4567</li>
        </ul>
      </>
    ),
  },
];

const ContactUs: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="gap-8">
        {/* Main Content */}
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-300 mb-4">
              Contact Us
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {CONTACT_SECTIONS.map(({ id, title, content, index }) =>
              id !== "contact-form" ? (
                <section className="mb-8" id={id} key={id}>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-300 mb-4">
                    {index}. {title}
                  </h2>
                  <div className="text-gray-700 dark:text-gray-300">
                    {content}
                  </div>
                </section>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;

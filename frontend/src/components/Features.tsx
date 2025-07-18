import React from "react";

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

const FEATURES_DATA: Feature[] = [
  {
    icon: "🛫",
    title: "Flight Companion Matching",
    desc: "Find and connect with trusted travelers on your route for a safer, more social journey.",
  },
  {
    icon: "🚗",
    title: "Airport Pickup Service",
    desc: "Book reliable airport pickups and drop-offs with verified drivers in your area.",
  },
  {
    icon: "🛡️",
    title: "Safety & Verification",
    desc: "All users are verified for identity and safety, with in-app emergency assistance available.",
  },
  {
    icon: "💬",
    title: "Secure Messaging",
    desc: "Communicate and coordinate with companions and drivers securely within the app.",
  },
  {
    icon: "🌐",
    title: "Multi-language Support",
    desc: "Switch between languages for a seamless experience wherever you travel.",
  },
  {
    icon: "⭐",
    title: "Ratings & Reviews",
    desc: "Build trust with transparent ratings and reviews for all users.",
  },
];

const Features: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in px-0 py-28 ">
      <h2
        className="text-3xl font-bold mb-10 tracking-tight text-white text-center dark:text-[#00BCD4]"
      >
        Features
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {FEATURES_DATA.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl bg-white/70 shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8 flex flex-col items-center border border-[rgba(8,43,109,0.08)] backdrop-blur-sm group"
            style={{ minHeight: 280 }}
          >
            <span className="text-6xl mb-5 drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
              {feature.icon}
            </span>
            <h3
              className="text-xl font-extrabold mb-3 tracking-tight"
              style={{ color: "var(--color-primary)" }}
            >
              {feature.title}
            </h3>
            <p
              className="text-base text-center text-gray-700"
              style={{ color: "#2c3e50" }}
            >
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;

import React from "react";
import Features from "./Features";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";
import { Link } from "react-router-dom";

const Homepage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCC3C4] via-[#f8D597] to-[#CBDDDF] ">
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section */}
      <div
        className="flex flex-col items-center justify-center text-center min-h-screen relative"
        style={{
          backgroundImage: "url('/images/airplane.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#CBDDDF]"></div>

        {/* Content container */}
        <div className="relative z-10 text-left ">
          <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">
            WingCompanion
          </h1>
          <p className="text-xl text-white max-w-xl drop-shadow-md mb-8">
            Connecting travelers for safer, more enjoyable journeys—find trusted
            flight companions and reliable airport pickups.
          </p>
          
          {/* Action Buttons */}
          <div className="flex gap-4 flex-col sm:flex-row ">
            <Link
              to="/flight-companion"
              className="inline-block no-underline  bg-white text-[#020F6F] font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-50 hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center"
            >
              Flight Companion
            </Link>
            <Link
              to="/pickup"
              className="inline-block no-underline  bg-[#020F6F] text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center border-2 border-white"
            >
              Pickup Service
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <Features />

      {/* Footer */}
      <Footer />

      {/* Fade-in animation keyframes */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 1.2s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
};

export default Homepage;

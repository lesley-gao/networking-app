import React from "react";
import Features from "./Features";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";
import { Link } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const Homepage: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  return (
    <div
      className={
        isDarkMode
          ? "min-h-screen bg-gradient-to-b from-[#232B3A] via-[#1A2330] to-[#0B1320]"
          : "min-h-screen bg-gradient-to-b from-[#FCC3C4] via-[#f8D597] to-[#CBDDDF]"
      }
      style={{ transition: "background 0.3s" }}
    >
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section */}
      <div
        className="flex flex-col justify-center min-h-screen relative p-8 md:p-16 lg:p-32"
        style={{
          backgroundImage: isDarkMode
            ? "url('/images/airplane-night.jpg')"
            : "url('/images/airplane.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transition: "background 0.3s"
        }}
      >
        {/* overlay for text readability */}
        <div
          className={
            isDarkMode
              ? "absolute inset-0 bg-gradient-to-t from-[#0B1320]/90 to-transparent"
              : "absolute inset-0 bg-gradient-to-t from-transparent to-[#CBDDDF]"
          }
        ></div>

        {/* Content container */}
        <div className="relative z-10 text-left max-w-2xl">
          <h1
            className={
              isDarkMode
                ? "text-5xl font-bold mb-4 text-[#00BCD4] drop-shadow-lg font-serif"
                : "text-5xl font-bold mb-4 text-white drop-shadow-lg font-serif"
            }
          >
            WingCompanion
          </h1>
          <p
            className={
              isDarkMode
                ? "text-xl font-medium text-gray-200 max-w-xl mb-8 drop-shadow-lg"
                : "text-xl font-medium text-white max-w-xl mb-8 drop-shadow-lg"
            }
          >
            Connecting travelers for safer, more enjoyable journeys — find trusted flight companions and reliable airport pickups.
          </p>
          {/* Action Buttons */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <Link
              to="/flight-companion"
              className={
                isDarkMode
                  ? "inline-block no-underline bg-[#232B3A] text-[#00BCD4] font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-[#1A2330] hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center border-2 border-[#00BCD4]"
                  : "inline-block no-underline bg-white text-[#020F6F] font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-50 hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center"
              }
              style={{ transition: "background 0.3s, color 0.3s" }}
            >
              Flight Companion
            </Link>
            <Link
              to="/pickup"
              className={
                isDarkMode
                  ? "inline-block no-underline bg-[#00BCD4] text-[#232B3A] font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-[#0097A7] hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center border-2 border-[#00BCD4]"
                  : "inline-block no-underline bg-[#020F6F] text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center border-2 border-white"
              }
              style={{ transition: "background 0.3s, color 0.3s" }}
            >
              Pickup Service
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={isDarkMode ? "bg-[#1E202A]" : ""}>
        <Features />
      </div>

      {/* Footer */}
      <div className={isDarkMode ? "bg-[#1E202A]" : ""}>
        <Footer />
      </div>

      {/* Fade-in animation keyframes */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 1.2s cubic-bezier(.4,0,.2,1);
        }
        body.dark {
          background: #0B1320;
        }
      `}</style>
    </div>
  );
};

export default Homepage;

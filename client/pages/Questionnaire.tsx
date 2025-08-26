import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Questionnaire() {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string>("");

  const handleContinue = () => {
    if (selectedOption) {
      console.log("Selected role:", selectedOption);

      // Redirect based on selected role
      if (selectedOption === 'guide') {
        navigate('/guide-profile');
      } else if (selectedOption === 'seeker') {
        // For now, redirect to home. Later we can create a seeker profile page
        navigate('/');
      }
    }
  };

  const handleSkip = () => {
    console.log("User skipped role selection");
    // Redirect to dashboard without role selection
  };

  return (
    <div className="min-h-screen bg-black text-white font-instrument flex items-center justify-center">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-20 w-[600px] h-[1000px] rotate-[-87deg] rounded-full bg-gradient-to-r from-purple-500/40 to-indigo-600/40 blur-[150px]" />
        <div className="absolute bottom-20 right-20 w-[400px] h-[800px] rotate-[-87deg] rounded-full bg-gradient-to-r from-purple-400/20 to-blue-500/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
        <div className="text-center space-y-8 sm:space-y-12">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight lg:whitespace-nowrap">
              Are you a Guide or a Seeker?
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-white/90">
              Please select one of the following options.
            </p>
          </div>

          {/* Option Buttons */}
          <div className="flex flex-row gap-4 justify-center items-center px-4">
            <button
              onClick={() => setSelectedOption("guide")}
              className={`flex-1 max-w-[150px] px-4 py-3 rounded-xl border-2 text-base sm:text-lg lg:text-xl xl:text-2xl font-medium transition-all duration-300 hover:scale-105 ${
                selectedOption === "guide"
                  ? "border-purple-500 bg-purple-500/20 text-white"
                  : "border-purple-500 text-white hover:bg-purple-500/10"
              }`}
            >
              Guide
            </button>
            <button
              onClick={() => setSelectedOption("seeker")}
              className={`flex-1 max-w-[150px] px-4 py-3 rounded-xl border-2 text-base sm:text-lg lg:text-xl xl:text-2xl font-medium transition-all duration-300 hover:scale-105 ${
                selectedOption === "seeker"
                  ? "border-purple-500 bg-purple-500/20 text-white"
                  : "border-purple-500 text-white hover:bg-purple-500/10"
              }`}
            >
              Seeker
            </button>
          </div>

          {/* Continue Button */}
          <div className="space-y-4 sm:space-y-6">
            <button
              onClick={handleContinue}
              disabled={!selectedOption}
              className={`w-full px-8 py-3 rounded-xl text-lg sm:text-xl lg:text-2xl font-medium transition-all duration-300 ${
                selectedOption
                  ? "bg-purple-600 hover:bg-purple-700 text-white hover:scale-105 cursor-pointer"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>

            {/* Skip Option */}
            <div>
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-300 text-lg sm:text-xl lg:text-2xl font-medium transition-colors"
              >
                Skip
              </button>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="pt-8">
            <Link
              to="/"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Index() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsNavbarScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll function
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-instrument overflow-x-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-20 w-[600px] h-[1000px] rotate-[-87deg] rounded-full bg-gradient-to-r from-purple-500/40 to-indigo-600/40 blur-[150px]" />
        <div className="absolute bottom-20 right-20 w-[400px] h-[800px] rotate-[-87deg] rounded-full bg-gradient-to-r from-purple-400/20 to-blue-500/20 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isNavbarScrolled ? "py-2 backdrop-blur-md bg-black/50" : "py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="text-2xl font-bold text-white">Peerly</div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-white hover:text-purple-400 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-white hover:text-purple-400 transition-colors"
              >
                About
              </button>
            </div>

            {/* Sign Up & Language */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                to="/signin"
                className="px-6 py-2 border border-white rounded hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105 inline-block text-center"
              >
                Sign Up
              </Link>
              <div className="flex items-center space-x-1 cursor-pointer">
                <span>EN</span>
                <ChevronDown size={16} />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden mt-4 py-4 border-t border-gray-800">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="text-left text-white hover:text-purple-400"
                >
                  How It Works
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className="text-left text-white hover:text-purple-400"
                >
                  About
                </button>
                <Link
                  to="/signin"
                  className="px-6 py-2 border border-white rounded w-fit inline-block text-center"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium leading-tight mb-8 animate-fade-in-up">
            Learn Faster. Teach Better.
            <br />
            Grow Together
          </h1>

          <p className="text-lg sm:text-xl max-w-4xl mx-auto mb-12 text-white/90 animate-fade-in-up animation-delay-200">
            Peerly connects students and professionals through peer-to-peer
            sessions. Share your skills, get help when you're stuck, and grow in
            a community that believes knowledge gets stronger when it's shared.
          </p>

          <Link
            to="/signin"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 rounded-lg text-lg font-medium hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 animate-fade-in-up animation-delay-400 cursor-pointer inline-block text-center"
          >
            Get Started
          </Link>

          {/* Interactive Flip Cards Grid - Below the button */}
          <div className="mt-16 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center max-w-5xl mx-auto">
              {/* Photography Card */}
              <div className="transform rotate-[-8deg] animate-float">
                <div className="flip-card w-32 h-32 lg:w-40 lg:h-40 group cursor-pointer perspective-1000">
                  <div className="flip-card-inner w-full h-full relative transition-transform duration-700 transform-style-preserve-3d group-hover:rotate-y-180">
                    <div className="flip-card-front absolute w-full h-full backface-hidden rounded-2xl shadow-2xl">
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/55b82bf5cc275e3968860138472d98b3509ebbfd?width=477"
                        alt="Photography"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    </div>
                    <div className="flip-card-back absolute w-full h-full backface-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 rotate-y-180 flex items-center justify-center shadow-2xl">
                      <span className="text-white font-bold text-sm text-center px-2">
                        Explore Photography
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coding Card */}
              <div className="transform rotate-[5deg] animate-float animation-delay-500">
                <div className="flip-card w-32 h-32 lg:w-40 lg:h-40 group cursor-pointer perspective-1000">
                  <div className="flip-card-inner w-full h-full relative transition-transform duration-700 transform-style-preserve-3d group-hover:rotate-y-180">
                    <div className="flip-card-front absolute w-full h-full backface-hidden rounded-2xl shadow-2xl">
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/c30327ca5956043ac2f1df33252d86e3b5d701d4?width=477"
                        alt="Coding"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    </div>
                    <div className="flip-card-back absolute w-full h-full backface-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 rotate-y-180 flex items-center justify-center shadow-2xl">
                      <span className="text-white font-bold text-sm text-center px-2">
                        Explore Coding
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* College Card - Center */}
              <div className="transform rotate-[-3deg] animate-float animation-delay-200">
                <div className="flip-card w-32 h-32 lg:w-40 lg:h-40 group cursor-pointer perspective-1000">
                  <div className="flip-card-inner w-full h-full relative transition-transform duration-700 transform-style-preserve-3d group-hover:rotate-y-180">
                    <div className="flip-card-front absolute w-full h-full backface-hidden rounded-2xl shadow-2xl">
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/876de79f0a42553bbacf6315335dd7a6036d8e3b?width=477"
                        alt="College"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    </div>
                    <div className="flip-card-back absolute w-full h-full backface-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 rotate-y-180 flex items-center justify-center shadow-2xl">
                      <span className="text-white font-bold text-sm text-center px-2">
                        Explore Learning
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editing Card */}
              <div className="transform rotate-[7deg] animate-float animation-delay-800">
                <div className="flip-card w-32 h-32 lg:w-40 lg:h-40 group cursor-pointer perspective-1000">
                  <div className="flip-card-inner w-full h-full relative transition-transform duration-700 transform-style-preserve-3d group-hover:rotate-y-180">
                    <div className="flip-card-front absolute w-full h-full backface-hidden rounded-2xl shadow-2xl">
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/407f48c6267594929c96221d2cb3cc572e06910f?width=477"
                        alt="Editing"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    </div>
                    <div className="flip-card-back absolute w-full h-full backface-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 rotate-y-180 flex items-center justify-center shadow-2xl">
                      <span className="text-white font-bold text-sm text-center px-2">
                        Explore Editing
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Film and TV Card */}
              <div className="transform rotate-[-5deg] animate-float animation-delay-1000">
                <div className="flip-card w-32 h-32 lg:w-40 lg:h-40 group cursor-pointer perspective-1000">
                  <div className="flip-card-inner w-full h-full relative transition-transform duration-700 transform-style-preserve-3d group-hover:rotate-y-180">
                    <div className="flip-card-front absolute w-full h-full backface-hidden rounded-2xl shadow-2xl">
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/8a08097494c0d9141095879db567ec98d81e5022?width=477"
                        alt="Film and TV"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    </div>
                    <div className="flip-card-back absolute w-full h-full backface-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 rotate-y-180 flex items-center justify-center shadow-2xl">
                      <span className="text-white font-bold text-sm text-center px-2">
                        Explore Film & TV
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 animate-fade-in-up">
              How it works
            </h2>
            <p className="text-xl lg:text-2xl text-white/90 max-w-4xl animate-fade-in-up animation-delay-200">
              Peerly makes learning simple: set up your profile, get matched
              with the right peers, and grow by sharing skills together.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-16">
              {/* Step 1 */}
              <div className="animate-fade-in-up animation-delay-400">
                <h3 className="text-2xl lg:text-3xl font-medium mb-4">
                  Create Your Profile
                </h3>
                <p className="text-lg text-white/80">
                  Sign up and set up your skill profile — what you know and what
                  you want to learn.
                </p>
              </div>

              {/* Step 2 */}
              <div className="animate-fade-in-up animation-delay-600">
                <h3 className="text-2xl lg:text-3xl font-medium mb-4">
                  Match with Peers
                </h3>
                <p className="text-lg text-white/80">
                  Our smart system connects you with people who complement your
                  skills and learning goals.
                </p>
              </div>

              {/* Step 3 */}
              <div className="animate-fade-in-up animation-delay-800">
                <h3 className="text-2xl lg:text-3xl font-medium mb-4">
                  Start Learning Together
                </h3>
                <p className="text-lg text-white/80">
                  Schedule peer sessions, exchange knowledge, and grow together
                  — no tutors, just peers.
                </p>
              </div>
            </div>

            <div className="animate-fade-in-up animation-delay-1000">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/0be1e881fdc10633edfb2f16b42211466e33c00c?width=1224"
                alt="Student in library"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-16 animate-fade-in-up">
            About us
          </h2>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="animate-fade-in-up animation-delay-200">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/aedeba38c394ddb0a7735233338c6455b8acdd5f?width=840"
                alt="Shreemanth K"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>

            <div className="space-y-8 animate-fade-in-up animation-delay-400">
              <p className="text-xl lg:text-2xl leading-relaxed text-white/90">
                Hi, I'm Shreemanth K, the creator of Peerly. What began as a
                simple side project quickly turned into something bigger — the
                belief that learning is better when we do it together. Peerly is
                designed to connect students and professionals so they can share
                skills, exchange knowledge, and grow as a community. It's more
                than just a platform — it's a movement towards collaboration,
                curiosity, and growth.
              </p>

              <div className="pt-8">
                <h3 className="text-4xl lg:text-5xl font-bold mb-4">Contact</h3>
                <p className="text-xl text-white/90">
                  Email: shreemanthkunthe02@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Anirudh Section */}
      <section className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-8 animate-fade-in-up animation-delay-200">
              <p className="text-xl lg:text-2xl leading-relaxed text-white/90">
                I'm Anirudh Kulkarni, a developer working on Peerly. What
                started as a simple idea has grown into a platform built on
                collaboration, curiosity, and community. At Peerly, students and
                professionals come together to share skills, exchange knowledge,
                and learn from one another — making growth a collective journey
                rather than a solo one.
              </p>

              <div className="pt-8">
                <h3 className="text-4xl lg:text-5xl font-bold mb-4">Contact</h3>
                <p className="text-xl text-white/90">
                  Email ID : anirudh.kulkarni2382004@gmail.com
                </p>
              </div>
            </div>

            <div className="animate-fade-in-up animation-delay-400">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fff2e6c54d3c244c59f587dda5e373ea2%2F22ecefb965fc4dff90ff7ba07463f4d1?format=webp&width=800"
                alt="Anirudh Kulkarni"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative z-10 py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-full">
            <div className="mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal leading-tight mb-4 animate-fade-in-up bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Ready to Learn? Start Sharing Skills Today!
              </h2>
              <p className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal leading-tight text-white animate-fade-in-up animation-delay-200">
                Grow, learn, and share with like-minded people. Master skills,
                get guidance, or teach others — with Peerly, knowledge grows
                stronger together
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-5 animate-fade-in-up animation-delay-400">
              <Link
                to="/signin"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded text-sm font-medium hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 w-fit inline-block text-center"
              >
                Get Started
              </Link>
              <button className="border border-blue-600 text-white px-6 py-3 rounded text-sm font-normal hover:scale-105 transition-all duration-300 hover:bg-blue-600 hover:text-white w-fit">
                Join the Community
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Logo and Tagline */}
            <div className="md:col-span-2">
              <div className="text-2xl font-bold mb-4">Peerly</div>
              <p className="text-lg text-white/80 mb-6">
                Learn Faster. Teach Better. Grow Together.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-2 text-white/80">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Become a Partner
                  </a>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold mb-4">Social</h4>
              <ul className="space-y-2 text-white/80">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-white/60">
              ©2025 Shreemanth Kunthe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

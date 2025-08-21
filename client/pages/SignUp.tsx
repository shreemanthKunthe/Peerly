import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sign up attempt", { name, email, password, keepLoggedIn });
    
    // Simulate successful sign-up
    // In a real app, you'd create the account here
    if (name && email && password) {
      // Redirect to questionnaire page after successful registration
      navigate('/questionnaire');
    }
  };

  const handleGoogleSignUp = () => {
    console.log("Google sign up");
    // Simulate successful Google sign-up
    navigate('/questionnaire');
  };

  return (
    <div className="min-h-screen bg-black text-white font-instrument flex items-center justify-center">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-20 w-[600px] h-[1000px] rotate-[-87deg] rounded-full bg-gradient-to-r from-purple-500/40 to-indigo-600/40 blur-[150px]" />
        <div className="absolute bottom-20 right-20 w-[400px] h-[800px] rotate-[-87deg] rounded-full bg-gradient-to-r from-purple-400/20 to-blue-500/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto p-4">
        <div className="bg-black rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid lg:grid-cols-2 min-h-[600px]">
            {/* Left side - Image */}
            <div className="hidden lg:block relative">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/0099abc26303fb048957884d43b74db6ba7cf9cf?width=850"
                alt="Students collaborating"
                className="w-full h-full object-cover rounded-l-3xl"
              />
            </div>

            {/* Right side - Form */}
            <div className="flex items-center justify-center p-8 lg:p-12">
              <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center lg:text-left">
                  <h1 className="text-3xl font-bold text-white mb-2">Sign up</h1>
                  <p className="text-gray-400 text-sm">
                    Please sign up to continue to your account.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:border-blue-500 transition-colors peer"
                      placeholder="Name"
                      required
                    />
                    <label
                      htmlFor="name"
                      className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                        name || document.activeElement?.id === 'name'
                          ? '-top-2 text-xs bg-black px-1 text-blue-500'
                          : 'top-3 text-gray-400'
                      }`}
                    >
                      Name
                    </label>
                  </div>

                  {/* Email Field */}
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:border-blue-500 transition-colors peer"
                      placeholder="Email"
                      required
                    />
                    <label
                      htmlFor="email"
                      className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                        email || document.activeElement?.id === 'email'
                          ? '-top-2 text-xs bg-black px-1 text-blue-500'
                          : 'top-3 text-gray-400'
                      }`}
                    >
                      Email
                    </label>
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors pr-10"
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Keep me logged in */}
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                      className="flex items-center justify-center w-5 h-5 border border-white rounded transition-colors"
                    >
                      {keepLoggedIn && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <span className="text-white text-sm font-medium">Keep me logged in</span>
                  </div>

                  {/* Sign Up Button */}
                  <button
                    type="submit"
                    className="w-full bg-white text-black py-3 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                  >
                    Sign up
                  </button>

                  {/* Divider */}
                  <div className="text-center">
                    <span className="text-white text-sm">or</span>
                  </div>

                  {/* Google Sign Up */}
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="w-full bg-white text-gray-800 py-3 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 border border-gray-300"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Sign up with Google</span>
                  </button>
                </form>

                {/* Sign In Link */}
                <div className="text-center pt-4">
                  <p className="text-gray-400 text-sm">
                    Already have an account?{' '}
                    <Link to="/signin" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">
                      Sign-in Now
                    </Link>
                  </p>
                </div>

                {/* Back to home link */}
                <div className="text-center pt-4">
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

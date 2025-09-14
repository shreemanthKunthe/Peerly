import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Upload } from 'lucide-react';

export default function GuideProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    usn: '',
    bio: '',
    domain: '',
    portfolioLink: '',
    linkedinLink: '',
    profileImage: null as File | null
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Guide profile data:', formData);
    // Here you would typically save the profile data
    // For now, we'll just redirect to a success page or dashboard
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/questionnaire');
  };

  return (
    <div className="min-h-screen bg-black text-white font-instrument flex items-center justify-center p-4">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-20 w-[600px] h-[1000px] rotate-[-87deg] rounded-full bg-gradient-to-r from-purple-500/40 to-indigo-600/40 blur-[150px]" />
        <div className="absolute bottom-20 right-20 w-[400px] h-[800px] rotate-[-87deg] rounded-full bg-gradient-to-r from-purple-400/20 to-blue-500/20 blur-[120px]" />
      </div>

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-4xl bg-black/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Create your guider profile
            </h1>
            <p className="text-sm sm:text-base text-gray-300">
              Set up your profile to help others learn and grow
            </p>
          </div>
          <button 
            onClick={handleCancel}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Profile Image Section */}
          <div className="bg-gray-900/50 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 flex items-center justify-center">
                    {formData.profileImage ? (
                      <img 
                        src={URL.createObjectURL(formData.profileImage)} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">?</span>
                      </div>
                    )}
                  </div>
                  {/* Upload overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={20} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    Add your profile photo
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Upload a professional, well-lit headshot where your face is clearly visible
                  </p>
                </div>
                
                {/* Upload Button */}
                <label className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 cursor-pointer shadow-lg">
                  <Upload size={16} />
                  <span>Upload Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-gray-900/50 rounded-xl p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-3">
                  <label className="block text-white text-sm font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    required
                  />
                </div>

                {/* USN */}
                <div className="space-y-3">
                  <label className="block text-white text-sm font-medium">USN *</label>
                  <input
                    type="text"
                    value={formData.usn}
                    onChange={(e) => handleInputChange('usn', e.target.value)}
                    placeholder="Enter your USN"
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-gray-900/50 rounded-xl p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">
                About You
              </h3>
              <div className="space-y-6">
                {/* Bio */}
                <div className="space-y-3">
                  <label className="block text-white text-sm font-medium">Bio *</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself, your experience, and what makes you a great guide..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                    required
                  />
                </div>

                {/* Domain */}
                <div className="space-y-3">
                  <label className="block text-white text-sm font-medium">Expertise Domain *</label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    placeholder="e.g., Web Development, Photography, Music Production"
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Links Section */}
            <div className="bg-gray-900/50 rounded-xl p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">
                Professional Links
              </h3>
              <div className="space-y-6">
                {/* Portfolio Link */}
                <div className="space-y-3">
                  <label className="block text-white text-sm font-medium">Portfolio Link</label>
                  <input
                    type="url"
                    value={formData.portfolioLink}
                    onChange={(e) => handleInputChange('portfolioLink', e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>

                {/* LinkedIn Link */}
                <div className="space-y-3">
                  <label className="block text-white text-sm font-medium">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={formData.linkedinLink}
                    onChange={(e) => handleInputChange('linkedinLink', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-8 py-4 rounded-lg border border-gray-600 bg-transparent text-white font-medium hover:bg-gray-800 hover:border-gray-500 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Create Profile
            </button>
          </div>
        </form>

        {/* Back to home link */}
        <div className="text-center pt-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

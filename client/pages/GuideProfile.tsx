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

      {/* Background Image (blurred) */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://api.builder.io/api/v1/image/assets/TEMP/2df51cd68cffc0b6ec2c6094b7e3c99de5f7acd1?width=1280" 
          alt="Background" 
          className="w-full h-full object-cover opacity-30 blur-sm"
        />
      </div>

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-2xl bg-black/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl lg:text-3xl font-semibold text-white">
            Create your guider profile
          </h1>
          <button 
            onClick={handleCancel}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Image Section */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex flex-col items-center lg:items-start space-y-6">
              <h3 className="text-lg text-white">Add your image</h3>
              
              {/* Profile Image */}
              <div className="relative">
                <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full bg-gray-700 overflow-hidden">
                  {formData.profileImage ? (
                    <img 
                      src={URL.createObjectURL(formData.profileImage)} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src="https://api.builder.io/api/v1/image/assets/TEMP/2df51cd68cffc0b6ec2c6094b7e3c99de5f7acd1?width=1280" 
                      alt="Default profile" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              {/* Upload Button */}
              <label className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-all duration-300 cursor-pointer">
                <span>Upload Photo</span>
                <Upload size={14} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              
              {/* Help Text */}
              <p className="text-xs text-gray-400 max-w-60">
                Upload a professional well lit-headshot where your face is visible
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-white text-base font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John doe"
                className="w-full px-4 py-3 rounded-lg border border-gray-400 bg-white text-gray-600 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* USN */}
            <div className="space-y-2">
              <label className="block text-white text-base font-medium">USN</label>
              <input
                type="text"
                value={formData.usn}
                onChange={(e) => handleInputChange('usn', e.target.value)}
                placeholder="2BA"
                className="w-full px-4 py-3 rounded-lg border border-gray-400 bg-white text-gray-600 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="block text-white text-base font-medium">Write your Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="About you"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-400 bg-white text-gray-600 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              required
            />
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <label className="block text-white text-base font-medium">Domain</label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => handleInputChange('domain', e.target.value)}
              placeholder="Coding, videography"
              className="w-full px-4 py-3 rounded-lg border border-gray-400 bg-white text-gray-600 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Portfolio Link */}
          <div className="space-y-2">
            <label className="block text-white text-base font-medium">Portfolio link</label>
            <input
              type="url"
              value={formData.portfolioLink}
              onChange={(e) => handleInputChange('portfolioLink', e.target.value)}
              placeholder="Please share a sharable link"
              className="w-full px-4 py-3 rounded-lg border border-gray-400 bg-white text-gray-600 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* LinkedIn Link */}
          <div className="space-y-2">
            <label className="block text-white text-base font-medium">LinkedIn profile link</label>
            <input
              type="url"
              value={formData.linkedinLink}
              onChange={(e) => handleInputChange('linkedinLink', e.target.value)}
              placeholder="Please share a sharable link"
              className="w-full px-4 py-3 rounded-lg border border-gray-400 bg-white text-gray-600 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-500 bg-white text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
            >
              Submit
            </button>
          </div>
        </form>

        {/* Back to home link */}
        <div className="text-center pt-6">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

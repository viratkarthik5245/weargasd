// src/components/pages/Tutorials.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  Download,
  ArrowRight,
  Lightbulb,
  Target,
  Zap,
  Award,
  Search,
  Filter,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { VideoModal } from '../VideoModal';
import { DarkPageWrapper, ChristmasTree, GiftBox } from '../ui';
import { Card } from '../common/Card';
import { PageSidebar } from '../navigation/PageSidebar';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export const Tutorials: React.FC = () => {
  const isChristmas = new Date().getMonth() === 11 || new Date().getMonth() === 0;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isVideoModalOpen, setIsVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');

  const categories = [
    { id: 'all', name: 'All Tutorials', count: 0 },
    { id: 'getting-started', name: 'Getting Started', count: 0 },
    { id: 'tools-overview', name: 'Tools Overview', count: 0 },
    { id: 'job-strategy', name: 'Job Strategy', count: 0 },
    { id: 'advanced-strategy', name: 'Advanced Strategy', count: 0 },
    { id: 'linkedin-tips', name: 'LinkedIn Tips', count: 0 },
    { id: 'interview-prep', name: 'Interview Prep', count: 0 },
    { id: 'optimization', name: 'Optimization', count: 0 },
    { id: 'analysis', name: 'Analysis', count: 0 },
  ];

  const allTutorials = [
    {
      id: 1,
      title: 'Getting Started with PrimoBoost AI',
      description: 'Get started on your first resume.',
      duration: '2:52',
      difficulty: 'Beginner',
      category: 'getting-started',
      thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '12.5K',
      rating: 4.9,
      videoUrl: 'https://www.youtube.com/watch?v=x6AD2JsGafA',
      isPopular: true,
    },
    {
      id: 2,
      title: 'JD-Based Resume Optimization',
      description: 'Master the art of tailoring your resume to specific job descriptions.',
      duration: '2:30',
      difficulty: 'Intermediate',
      category: 'optimization',
      thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '8.2K',
      rating: 4.8,
      videoUrl: 'https://www.youtube.com/watch?v=_Jez3fo4NJs',
      isPopular: false,
    },
    {
      id: 3,
      title: 'Resume Score Analysis Deep Dive',
      description: 'Understand how our AI scores your resume and what each metric means.',
      duration: '6:20',
      difficulty: 'Beginner',
      category: 'analysis',
      thumbnail: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '15.1K',
      rating: 4.9,
      videoUrl: 'https://res.cloudinary.com/dlkovvlud/video/upload/v1700000000/sample_video.mp4',
      isPopular: true,
    },
    {
      id: 4,
      title: 'Mastering PrimoBoost AI: Your Four Essential Tools',
      description: 'A comprehensive guide on effectively utilizing all our tools.',
      duration: '10:15',
      difficulty: 'Beginner',
      category: 'tools-overview',
      thumbnail: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '5.3K',
      rating: 4.7,
      videoUrl: 'https://res.cloudinary.com/dlkovvlud/video/upload/v1700000000/sample_video.mp4',
      isPopular: false,
    },
    {
      id: 5,
      title: 'Job Search Mastery: Strategies to Land Your Dream Role',
      description: 'Learn proven techniques for effective job searching and interview preparation.',
      duration: '12:00',
      difficulty: 'Intermediate',
      category: 'job-strategy',
      thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '7.8K',
      rating: 4.9,
      videoUrl: 'https://res.cloudinary.com/dlkovvlud/video/upload/v1700000000/sample_video.mp4',
      isPopular: true,
    },
    {
      id: 6,
      title: "Cracking the Job Market: Combining AI Tools for Success",
      description: "Discover how to integrate PrimoBoost AI's tools to create a powerful job application strategy.",
      duration: '15:40',
      difficulty: 'Advanced',
      category: 'advanced-strategy',
      thumbnail: 'https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '6.1K',
      rating: 4.8,
      videoUrl: 'https://res.cloudinary.com/dlkovvlud/video/upload/v1700000000/sample_video.mp4',
      isPopular: false,
    },
  ];

  const updatedCategories = categories.map((cat) => {
    if (cat.id === 'all') return { ...cat, count: allTutorials.length };
    const count = allTutorials.filter((t) => t.category === cat.id).length;
    return { ...cat, count };
  });

  const filteredTutorials = allTutorials.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const s = searchTerm.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s);
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const mainVideoTutorial = filteredTutorials.length > 0 ? filteredTutorials[0] : allTutorials[0];

  const openVideoModal = (videoUrl: string, title: string) => {
    const embedUrl = videoUrl.replace('watch?v=', 'embed/');
    setCurrentVideoUrl(embedUrl);
    setCurrentVideoTitle(title);
    setIsVideoModal(true);
  };

  const closeVideoModal = () => {
    setIsVideoModal(false);
    setCurrentVideoUrl('');
    setCurrentVideoTitle('');
  };

  const learningPath = [
    { step: 1, title: 'Start with Basics', description: 'Learn how to upload your resume and understand the optimization process', duration: '15 minutes', icon: <Lightbulb className="w-6 h-6" /> },
    { step: 2, title: 'Master ATS Optimization', description: 'Understand how ATS systems work and optimize your resume accordingly', duration: '30 minutes', icon: <Target className="w-6 h-6" /> },
    { step: 3, title: 'Advanced Techniques', description: 'Learn keyword optimization, formatting, and industry-specific tips', duration: '45 minutes', icon: <Zap className="w-6 h-6" /> },
    { step: 4, title: 'Practice & Perfect', description: 'Apply your knowledge and create multiple optimized versions', duration: '60 minutes', icon: <Award className="w-6 h-6" /> },
  ];

  return (
    <DarkPageWrapper showSnow={isChristmas} showSanta={isChristmas}>
      {/* Page Sidebar */}
      <PageSidebar />
      
      {/* Main Content - with left margin for sidebar on desktop */}
      <div className="lg:ml-16">
        {/* Hero Section */}
        <section className="relative pt-20 sm:pt-24 pb-16 sm:pb-20">
        <div className="container-responsive">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto space-y-6"
          >
            {isChristmas && (
              <div className="flex justify-center gap-4 mb-4">
                <ChristmasTree size="sm" />
                <GiftBox />
                <ChristmasTree size="sm" />
              </div>
            )}

            <motion.div 
              variants={itemVariants}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${
                isChristmas
                  ? 'bg-gradient-to-br from-red-500/20 to-green-500/20 border border-red-400/30 shadow-red-500/30'
                  : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 shadow-emerald-500/30'
              }`}
            >
              <BookOpen className={`w-10 h-10 ${isChristmas ? 'text-red-400' : 'text-emerald-400'}`} />
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white"
            >
              Learn & Master
              <span className={`block bg-gradient-to-r bg-clip-text text-transparent ${
                isChristmas
                  ? 'from-red-400 via-yellow-400 to-green-400'
                  : 'from-emerald-400 via-cyan-400 to-blue-400'
              }`}>
                Resume Optimization
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto px-4"
            >
              Watch our comprehensive tutorials and transform your career with expert guidance.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Featured Tutorial */}
      <section className="relative py-12 sm:py-16">
        <div className="container-responsive max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {isChristmas ? '🎄 ' : ''}Featured Tutorial{isChristmas ? ' 🎄' : ''}
            </h2>
            <p className="text-slate-300">Watch our top recommended guide to get started</p>
          </motion.div>

          {mainVideoTutorial && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card padding="lg" className="overflow-hidden">
                <div className="aspect-video relative rounded-xl overflow-hidden mb-6">
                  <iframe
                    src={mainVideoTutorial.videoUrl.replace('watch?v=', 'embed/')}
                    title={mainVideoTutorial.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(mainVideoTutorial.difficulty)}`}>
                    {mainVideoTutorial.difficulty}
                  </span>
                  <span className="text-slate-400 text-sm flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {mainVideoTutorial.duration}
                  </span>
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(mainVideoTutorial.rating) ? 'fill-current' : ''}`} />
                    ))}
                    <span className="ml-1 text-slate-300 text-sm">{mainVideoTutorial.rating}</span>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{mainVideoTutorial.title}</h3>
                <p className="text-slate-300 mb-6">{mainVideoTutorial.description}</p>

                <div className="flex flex-wrap gap-3">
                  <span className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                    isChristmas ? 'bg-green-500/20 text-green-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <Users className="w-4 h-4 mr-2" />
                    {mainVideoTutorial.views} views
                  </span>
                  <button
                    onClick={() => window.open(mainVideoTutorial.videoUrl, '_blank')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                      isChristmas
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                    }`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Now
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </section>


      {/* All Tutorials */}
      <section className="relative py-12 sm:py-16 bg-slate-900/50">
        <div className="container-responsive max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">All Tutorials</h2>
            <p className="text-slate-300">Browse our full library of guides and videos</p>
          </motion.div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search tutorials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-base pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-base pl-10 pr-10 appearance-none cursor-pointer"
              >
                {updatedCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          {/* Tutorial Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {filteredTutorials.map((tutorial) => (
              <motion.div
                key={tutorial.id}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card padding="md" className="h-full group">
                  <div
                    className="relative aspect-video overflow-hidden rounded-xl mb-4 cursor-pointer"
                    onClick={() => window.open(tutorial.videoUrl, '_blank')}
                  >
                    <img
                      src={tutorial.thumbnail}
                      alt={tutorial.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(tutorial.difficulty)}`}>
                      {tutorial.difficulty}
                    </span>
                    <span className="text-slate-400 text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {tutorial.duration}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-2">{tutorial.title}</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{tutorial.description}</p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.round(tutorial.rating) ? 'fill-current' : ''}`} />
                      ))}
                      <span className="ml-1 text-slate-400 text-xs">{tutorial.rating}</span>
                    </div>
                    <button
                      onClick={() => openVideoModal(tutorial.videoUrl, tutorial.title)}
                      className={`text-sm font-medium flex items-center gap-1 transition-colors ${
                        isChristmas ? 'text-green-400 hover:text-green-300' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      Watch <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}

            {filteredTutorials.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg text-slate-400">No tutorials found matching your criteria.</p>
                <p className="text-sm text-slate-500">Try adjusting your search or filter options.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Learning Path */}
      <section className="relative py-16 sm:py-20">
        <div className="container-responsive max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {isChristmas ? '⭐ ' : ''}Recommended Learning Path{isChristmas ? ' ⭐' : ''}
            </h2>
            <p className="text-slate-300">Follow this structured path for best results</p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {learningPath.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ x: 10 }}
              >
                <Card padding="lg" className="group">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                      isChristmas
                        ? 'bg-gradient-to-r from-red-500 to-green-600'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    }`}>
                      {item.step}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                        <span className={`${isChristmas ? 'text-green-400' : 'text-emerald-400'}`}>{item.icon}</span>
                        <h3 className="text-base sm:text-lg font-bold text-white">{item.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isChristmas
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {item.duration}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </div>

                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-20">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 text-center shadow-2xl ${
              isChristmas
                ? 'bg-gradient-to-r from-red-600 via-red-700 to-green-700 shadow-red-500/30'
                : 'bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-700 shadow-emerald-500/30'
            }`}
          >
            {isChristmas && (
              <div className="flex justify-center gap-4 mb-6">
                <ChristmasTree size="md" />
                <GiftBox className="text-4xl" />
                <ChristmasTree size="md" />
              </div>
            )}

            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-white/90 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Ready to Transform Your Career?
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              {isChristmas ? '🎁 ' : ''}Start Learning Today{isChristmas ? ' 🎁' : ''}
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their careers with our tutorials.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-semibold bg-white text-slate-900 shadow-lg hover:shadow-xl transition-all"
              >
                Start Learning Now
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-semibold bg-white/10 text-white border border-white/30 hover:bg-white/20 transition-all"
              >
                <Download className="w-5 h-5" />
                Download Free Guide
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

        {/* Footer spacer */}
        <div className="h-8" />

        <VideoModal
          isOpen={isVideoModalOpen}
          onClose={closeVideoModal}
          videoUrl={currentVideoUrl}
          title={currentVideoTitle}
        />
      </div>
    </DarkPageWrapper>
  );
};

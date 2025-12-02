// src/components/ResumeScoreChecker.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  TrendingUp,
  Award,
  Lightbulb,
  ArrowLeft,
  Target,
  Zap,
  Clock,
  Palette,
  Sparkles,
  FileCheck,
  Search,
  Briefcase,
  LayoutDashboard,
  Bug,
  ArrowRight,
  BarChart3,
  Info,
  Eye,
  RefreshCw,
  Calendar,
  Shield,
  CheckCircle,
} from 'lucide-react';

// Animated gradient orb component
const GradientOrb: React.FC<{ className?: string; delay?: number }> = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
  />
);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
} as const;
import { FileUpload } from './FileUpload';
import { getComprehensiveScore } from '../services/scoringService';
import { LoadingAnimation } from './LoadingAnimation';
import { ComprehensiveScore, ScoringMode, ExtractionResult, ConfidenceLevel, MatchBand, DetailedScore } from '../types/resume';
import type { Subscription } from '../types/payment';
import { paymentService } from '../services/paymentService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth to get the user object

interface ResumeScoreCheckerProps {
  onNavigateBack: () => void;
  isAuthenticated: boolean;
  onShowAuth: () => void;
  userSubscription: Subscription | null;
  onShowSubscriptionPlans: (featureId?: string) => void;
  onShowAlert: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error', actionText?: string, onAction?: () => void) => void;
  refreshUserSubscription: () => Promise<void>;
  toolProcessTrigger: (() => void) | null;
  setToolProcessTrigger: React.Dispatch<React.SetStateAction<(() => void) | null>>;
}

export const ResumeScoreChecker: React.FC<ResumeScoreCheckerProps> = ({
  onNavigateBack,
  isAuthenticated,
  onShowAuth,
  userSubscription, // Keep this prop, but we'll fetch fresh data inside _analyzeResumeInternal
  onShowSubscriptionPlans,
  onShowAlert, // This is the prop in question
  refreshUserSubscription,
  toolProcessTrigger,
  setToolProcessTrigger,
}) => {
  // CRITICAL DEBUGGING STEP: Verify onShowAlert is a function immediately
  if (typeof onShowAlert !== 'function') {
    console.error('CRITICAL ERROR: onShowAlert prop is not a function or is undefined!', onShowAlert);
    // This will cause a React error, but it will confirm if the prop is truly missing at this point.
    throw new Error('onShowAlert prop is missing or invalid in ResumeScoreChecker');
  }

  // ADDED LOG: Check onShowAlert value at component render
  console.log('ResumeScoreChecker: onShowAlert prop value at render:', onShowAlert);

  console.log('ResumeScoreChecker: Component rendered. userSubscription:', userSubscription);
  const { user } = useAuth(); // Get the user object from AuthContext
  const navigate = useNavigate();
  const location = useLocation();
  const [extractionResult, setExtractionResult] = useState<ExtractionResult>({ text: '', extraction_mode: 'TEXT', trimmed: false });
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [scoringMode, setScoringMode] = useState<ScoringMode | null>(null);
  const [autoScoreOnUpload, setAutoScoreOnUpload] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [scoreResult, setScoreResult] = useState<ComprehensiveScore | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasShownCreditExhaustedAlert, setHasShownCreditExhaustedAlert] = useState(false);

  const [analysisInterrupted, setAnalysisInterrupted] = useState(false);

  // If we arrive from Job Details with state, prefill JD-based flow and jump to Step 1
  useEffect(() => {
    const state = (location.state || {}) as {
      jobDescription?: string;
      jobTitle?: string;
    };

    if (state.jobDescription || state.jobTitle) {
      setScoringMode('jd_based');
      setCurrentStep(1);
      if (state.jobDescription) setJobDescription(state.jobDescription);
      if (state.jobTitle) setJobTitle(state.jobTitle);
    }
  }, [location.state]);

  // NEW useEffect: Reset hasShownCreditExhaustedAlert when userSubscription changes
  useEffect(() => {
    setHasShownCreditExhaustedAlert(false);
  }, [userSubscription]);


  // Renamed analyzeResume to _analyzeResumeInternal
  const _analyzeResumeInternal = useCallback(async () => {
    console.log('_analyzeResumeInternal: Function started. Assuming credits are available.');

    // Ensure user is available before attempting to fetch subscription
    if (!user?.id) {
      console.error('_analyzeResumeInternal: User ID not available, cannot proceed with analysis.');
      onShowAlert('Authentication Required', 'User data not fully loaded. Please try again or sign in.', 'error', 'Sign In', onShowAuth);
      return;
    }

    // Re-fetch subscription to get the latest state for decrementing usage
    const latestUserSubscription = await paymentService.getUserSubscription(user.id);
    if (!latestUserSubscription || (latestUserSubscription.scoreChecksTotal - latestUserSubscription.scoreChecksUsed) <= 0) {
      console.error('_analyzeResumeInternal: Credits unexpectedly exhausted during internal analysis. This should not happen if pre-check worked.');
      onShowAlert('Credits Exhausted', 'Your credits were used up before analysis could complete. Please upgrade.', 'error', 'Upgrade Plan', () => onShowSubscriptionPlans('score-checker'));
      setAnalysisInterrupted(true);
      return;
    }

    if (!extractionResult.text.trim()) {
      onShowAlert('Missing Resume', 'Please upload your resume first to get a score.', 'warning');
      return;
    }

    if (scoringMode === 'jd_based') {
      if (!jobDescription.trim()) {
        onShowAlert('Missing Job Description', 'Job description is required for JD-based scoring.', 'warning');
        return;
      }
      if (!jobTitle.trim()) {
        onShowAlert('Missing Job Title', 'Job title is required for JD-based scoring.', 'warning');
        return;
      }
    }

    setScoreResult(null);
    setIsAnalyzing(true);
    setLoadingStep('Extracting & cleaning your resume...');
    console.log('_analyzeResumeInternal: Starting analysis, setIsAnalyzing(true).');

    try {
      if (scoringMode === 'jd_based') {
        setLoadingStep(`Comparing with Job Title: ${jobTitle}...`);
      }
      
      setLoadingStep('Scoring across 16 criteria...');

      const result = await getComprehensiveScore(
        extractionResult.text,
        scoringMode === 'jd_based' ? jobDescription : undefined,
        scoringMode === 'jd_based' ? jobTitle : undefined,
        scoringMode ?? undefined,
        extractionResult.extraction_mode,
        extractionResult.trimmed,
        uploadedFilename // Pass the filename here
      );

      setScoreResult(result);
      setCurrentStep(2);

      // Decrement usage after successful analysis
      const usageResult = await paymentService.useScoreCheck(latestUserSubscription.userId);
      if (usageResult.success) {
        await refreshUserSubscription(); // Refresh App.tsx state after usage
      } else {
        console.error('Failed to decrement score check usage:', usageResult.error);
        onShowAlert('Usage Update Failed', 'Failed to record score check usage. Please contact support.', 'error');
      }
    } catch (error: any) {
      console.error('_analyzeResumeInternal: Error in try block:', error);
      onShowAlert('Analysis Failed', `Failed to analyze resume: ${error.message || 'Unknown error'}. Please try again.`, 'error');
    } finally {
      setIsAnalyzing(false);
      setLoadingStep('');
      console.log('_analyzeResumeInternal: Analysis finished, setIsAnalyzing(false).');
    }
  }, [extractionResult, jobDescription, jobTitle, scoringMode, isAuthenticated, onShowAuth, onShowSubscriptionPlans, onShowAlert, refreshUserSubscription, user, uploadedFilename]);


  // New public function called by the button click
  const analyzeResume = useCallback(async () => {
    console.log('analyzeResume: Public function called.');

    if (scoringMode === null) {
      onShowAlert('Choose a Scoring Method', 'Please select either "Score Against a Job" or "General Score" to continue.', 'warning');
      return;
    }

    if (!isAuthenticated) {
      onShowAlert('Authentication Required', 'Please sign in to get your resume score.', 'error', 'Sign In', onShowAuth);
      return;
    }

    if (!user?.id) {
      onShowAlert('Authentication Required', 'User data not fully loaded. Please try again or sign in.', 'error', 'Sign In', onShowAuth);
      return;
    }

    if (!extractionResult.text.trim()) {
      onShowAlert('Missing Resume', 'Please upload your resume first to get a score.', 'warning');
      return;
    }

    if (scoringMode === 'jd_based') {
      if (!jobDescription.trim()) {
        onShowAlert('Missing Job Description', 'Job description is required for JD-based scoring.', 'warning');
        return;
      }
      if (!jobTitle.trim()) {
        onShowAlert('Missing Job Title', 'Job title is required for JD-based scoring.', 'warning');
        return;
      }
    }

    // --- Credit Check Logic ---
const currentSubscription = await paymentService.getUserSubscription(user.id);
const subscriptionCredits = currentSubscription
  ? currentSubscription.scoreChecksTotal - currentSubscription.scoreChecksUsed
  : 0;

const addOnCredits = await paymentService.getAddOnCreditsByType(user.id, 'score_check');
const totalCredits = Math.max(0, subscriptionCredits) + addOnCredits;
const hasScoreCheckCredits = totalCredits > 0;

console.log('[Credits] Subscription credits:', subscriptionCredits);
console.log('[Credits] Add-on credits:', addOnCredits);
console.log('[Credits] Total credits:', totalCredits);

const liteCheckPlan = paymentService.getPlanById("lite_check");
const hasFreeTrialAvailable =
  liteCheckPlan &&
  (!currentSubscription || currentSubscription.planId !== "lite_check");

if (hasScoreCheckCredits) {
  console.log('[Credits] Credits available, proceeding with analysis');
  _analyzeResumeInternal();
} else if (hasFreeTrialAvailable) {
  onShowAlert(
    "Activating Free Trial",
    "Activating your free trial for Resume Score Check...",
    "info"
  );
  try {
    await paymentService.activateFreeTrial(user.id);
    await refreshUserSubscription();
    onShowAlert(
      "Free Trial Activated!",
      "Your free trial has been activated. Analyzing your resume now.",
      "success"
    );
    _analyzeResumeInternal();
  } catch (error: any) {
    onShowAlert(
      "Free Trial Activation Failed",
      "Failed to activate free trial: " + (error.message || "Unknown error"),
      "error"
    );
  }
} else {
  const planName = currentSubscription
    ? paymentService.getPlanById(currentSubscription.planId)?.name ||
      "your current plan"
    : "your account";

  let message = "";
  if (subscriptionCredits <= 0 && addOnCredits <= 0) {
    if (currentSubscription) {
      message = `You have used all your Resume Score Checks from ${planName}.`;
    } else {
      message = "You don't have any active plan or add-on credits for Resume Score Checks.";
    }
    message += " Please purchase credits or upgrade your plan to continue.";
  } else {
    message = "Your Resume Score Check credits are exhausted. Please purchase more credits.";
  }

  console.log('[Credits] No credits available, showing upgrade modal');

  onShowAlert(
    "Resume Score Check Credits Exhausted",
    message,
    "warning",
    "Get Credits",
    () => onShowSubscriptionPlans("score-checker")
  );

  setHasShownCreditExhaustedAlert(true);
  setAnalysisInterrupted(true);
}

  }, [extractionResult, jobDescription, jobTitle, scoringMode, isAuthenticated, onShowAuth, onShowSubscriptionPlans, onShowAlert, refreshUserSubscription, user, _analyzeResumeInternal]); // Depend on _analyzeResumeInternal


  // The useEffect for re-triggering should remain as is, but now calls _analyzeResumeInternal with retries
  useEffect(() => {
    // Only attempt to re-trigger if analysis was interrupted and user is authenticated
    // AND if credits are now available.
    if (analysisInterrupted && isAuthenticated && userSubscription && (userSubscription.scoreChecksTotal - userSubscription.scoreChecksUsed) > 0) {
      console.log('ResumeScoreChecker: Analysis was interrupted, credits now available, attempting to re-trigger with internal retry.');
      setAnalysisInterrupted(false); // Reset the flag immediately
      setHasShownCreditExhaustedAlert(false); // Reset alert flag

      let retryCount = 0;
      let delay = 500;
      const MAX_RETRIES_INTERNAL = 6; // Max retries for internal re-trigger

      const attemptAnalysis = async () => {
        while (retryCount < MAX_RETRIES_INTERNAL) {
          const latestSub = await paymentService.getUserSubscription(user!.id); // Re-fetch to be sure
          if (latestSub && (latestSub.scoreChecksTotal - latestSub.scoreChecksUsed) > 0) {
            _analyzeResumeInternal(); // Now call the internal analysis function
            return;
          }
          retryCount++;
          if (retryCount < MAX_RETRIES_INTERNAL) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
        console.error('ResumeScoreChecker: Failed to re-trigger analysis after purchase due to persistent credit check failure.');
        onShowAlert('Analysis Not Started', 'We could not confirm your new credits. Please try again manually.', 'error');
      };

      attemptAnalysis();
    }
  }, [analysisInterrupted, isAuthenticated, userSubscription, _analyzeResumeInternal, onShowAlert, user]); // Depend on _analyzeResumeInternal

  useEffect(() => {
    setToolProcessTrigger(() => analyzeResume);
    return () => {
      setToolProcessTrigger(null);
    };
  }, [setToolProcessTrigger, analyzeResume]);

  const handleFileUpload = (result: ExtractionResult) => {
    setExtractionResult(result);
    setHasShownCreditExhaustedAlert(false);
    setUploadedFilename(result.filename || null);
    
    if (scoringMode === 'general' && autoScoreOnUpload && result.text.trim()) {
      setTimeout(() => analyzeResume(), 500);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchBandColor = (band: MatchBand) => {
    if (band.includes('Excellent') || band.includes('Very Good')) return 'text-green-600 dark:text-green-400';
    if (band.includes('Good') || band.includes('Fair')) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceColor = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case 'High': return 'text-green-600 bg-green-100 dark:text-green-900/20';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-900/20';
      case 'Low': return 'text-red-600 bg-red-100 dark:text-red-900/20';
    }
  };

  const getCategoryScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSelectScoringMode = (mode: ScoringMode) => {
    setScoringMode(mode);
    setCurrentStep(1);
  };

  const handleCheckAnotherResume = () => {
    setScoreResult(null);
    setExtractionResult({ text: '', extraction_mode: 'TEXT', trimmed: false });
    setJobDescription('');
    setJobTitle('');
    setCurrentStep(0);
    setHasShownCreditExhaustedAlert(false);
  };

  return (
    <>
      {isAnalyzing ? (
        <LoadingAnimation
          message={loadingStep}
          submessage="Please wait while we analyze your resume."
        />
      ) : (
        <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-[#0a1e1e] via-[#0d1a1a] to-[#070b14] text-slate-100 px-4 sm:px-0 lg:pl-16 transition-colors duration-300 overflow-hidden">
          {/* Animated background gradients */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <GradientOrb className="w-[500px] h-[500px] -top-40 -left-40 bg-emerald-500/20" delay={0} />
            <GradientOrb className="w-[400px] h-[400px] top-1/3 -right-40 bg-cyan-500/15" delay={2} />
            <GradientOrb className="w-[300px] h-[300px] bottom-20 left-1/4 bg-indigo-500/10" delay={4} />
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl shadow-lg border-b border-emerald-400/20 sticky top-0 z-40">
            <div className="container-responsive">
              <div className="flex items-center justify-between h-16 py-3">
                <button
                  onClick={onNavigateBack}
                  className="lg:hidden bg-gradient-to-r from-neon-cyan-500 to-neon-blue-500 text-white hover:from-neon-cyan-400 hover:to-neon-blue-400 active:from-neon-cyan-600 active:to-neon-blue-600 shadow-md hover:shadow-neon-cyan py-3 px-5 rounded-xl inline-flex items-center space-x-2 transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:block">Back to Home</span>
                </button>
                <h1 className="text-lg font-semibold text-emerald-50">Resume Score Checker</h1>
                <div className="w-24"></div>
              </div>
            </div>
          </div>

          <div className="relative flex-grow py-8">
            {currentStep === 0 && (
              <div className="container-responsive">
                {/* Hero Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-12"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 mb-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 text-sm font-medium">AI-Powered Analysis</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
                    Get Your Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Score</span>
                  </h1>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Our AI analyzes your resume against industry standards and ATS requirements to help you land more interviews
                  </p>
                </motion.div>

                {/* Scoring Method Cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
                  {/* JD-Based Scoring Card */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectScoringMode('jd_based')}
                    className={`relative p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden group ${
                      scoringMode === 'jd_based'
                        ? 'border-emerald-400/60 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 shadow-[0_0_40px_rgba(16,185,129,0.25)]'
                        : 'border-slate-700/50 hover:border-emerald-400/40 bg-slate-900/60 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Recommended Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs rounded-full font-semibold shadow-lg">
                        Recommended
                      </span>
                    </div>

                    {/* Icon with Glow */}
                    <div className="relative mb-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        scoringMode === 'jd_based'
                          ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                          : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 group-hover:from-emerald-500/30 group-hover:to-cyan-500/30'
                      }`}>
                        <Target className={`w-8 h-8 ${scoringMode === 'jd_based' ? 'text-white' : 'text-emerald-400'}`} />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100 mb-2">Score Against a Job</h3>
                    <p className="text-slate-400 text-sm mb-6">
                      Compare your resume against a specific job description for targeted optimization
                    </p>

                    {/* Features List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-slate-300 text-sm">Keyword match analysis</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-slate-300 text-sm">Skills gap identification</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-slate-300 text-sm">Role-specific recommendations</span>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {scoringMode === 'jd_based' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                    )}
                  </motion.button>

                  {/* General Scoring Card */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectScoringMode('general')}
                    className={`relative p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden group ${
                      scoringMode === 'general'
                        ? 'border-indigo-400/60 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 shadow-[0_0_40px_rgba(99,102,241,0.25)]'
                        : 'border-slate-700/50 hover:border-indigo-400/40 bg-slate-900/60 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Icon with Glow */}
                    <div className="relative mb-6 mt-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        scoringMode === 'general'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-[0_0_30px_rgba(99,102,241,0.5)]'
                          : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 group-hover:from-indigo-500/30 group-hover:to-purple-500/30'
                      }`}>
                        <BarChart3 className={`w-8 h-8 ${scoringMode === 'general' ? 'text-white' : 'text-indigo-400'}`} />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100 mb-2">General Score</h3>
                    <p className="text-slate-400 text-sm mb-6">
                      Get a comprehensive assessment against industry standards and best practices
                    </p>

                    {/* Features List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-slate-300 text-sm">ATS compatibility check</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-slate-300 text-sm">Format & structure analysis</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-slate-300 text-sm">Content quality scoring</span>
                      </div>
                    </div>

                    {/* Auto-score option */}
                    {scoringMode === 'general' && (
                      <div className="mt-6 pt-4 border-t border-slate-700/50">
                        <label className="flex items-center gap-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={autoScoreOnUpload}
                            onChange={(e) => setAutoScoreOnUpload(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-indigo-500 rounded focus:ring-indigo-500 bg-slate-800 border-slate-600"
                          />
                          <span className="text-sm text-slate-300">Auto-score on upload</span>
                        </label>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {scoringMode === 'general' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                    )}
                  </motion.button>
                </div>

                {/* What You'll Get Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 max-w-5xl mx-auto"
                >
                  <h3 className="text-lg font-semibold text-slate-100 mb-6 text-center">What You'll Get</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-3">
                        <Award className="w-6 h-6 text-amber-400" />
                      </div>
                      <p className="text-slate-300 text-sm font-medium">Overall Score</p>
                      <p className="text-slate-500 text-xs mt-1">0-100 rating</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                        <Lightbulb className="w-6 h-6 text-blue-400" />
                      </div>
                      <p className="text-slate-300 text-sm font-medium">Smart Tips</p>
                      <p className="text-slate-500 text-xs mt-1">AI suggestions</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-slate-300 text-sm font-medium">Improvements</p>
                      <p className="text-slate-500 text-xs mt-1">Action items</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-purple-400" />
                      </div>
                      <p className="text-slate-300 text-sm font-medium">Detailed Report</p>
                      <p className="text-slate-500 text-xs mt-1">Full breakdown</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {currentStep === 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="container-responsive"
              >
                <div className="max-w-4xl mx-auto">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6"
                  >
                    <button
                      onClick={() => setCurrentStep(0)}
                      className="bg-slate-800/80 hover:bg-slate-700/80 text-slate-100 font-semibold py-2 px-4 rounded-xl transition-all duration-300 flex items-center space-x-2 border border-slate-700/50 hover:border-emerald-400/30"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back to Scoring Method</span>
                    </button>
                  </motion.div>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                  >
                    <motion.div variants={itemVariants} className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_25px_80px_rgba(16,185,129,0.12)] border border-emerald-400/30 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-6 border-b border-emerald-400/20">
                        <h2 className="text-xl font-semibold text-emerald-50 flex items-center">
                          <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-400/40 mr-3">
                            <Upload className="w-5 h-5 text-emerald-300" />
                          </div>
                          Upload Your Resume
                        </h2>
                        <p className="text-slate-300 mt-1 ml-12">Upload your current resume for analysis</p>
                      </div>
                      <div className="p-6">
                        <FileUpload onFileUpload={handleFileUpload} />
                      </div>
                    </motion.div>

                    {scoringMode === 'jd_based' && (
                      <motion.div variants={itemVariants} className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_25px_80px_rgba(251,191,36,0.1)] border border-amber-400/30 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 border-b border-amber-400/20">
                          <h2 className="text-xl font-semibold text-amber-50 flex items-center">
                            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-400/40 mr-3">
                              <Briefcase className="w-5 h-5 text-amber-300" />
                            </div>
                            Job Title *
                          </h2>
                          <p className="text-slate-300 mt-1 ml-12">Enter the exact job title you're targeting</p>
                        </div>
                        <div className="p-6">
                          <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
                            className="w-full px-4 py-3 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-800/50 text-slate-100 placeholder-slate-400 transition-all duration-300"
                          />
                        </div>
                      </motion.div>
                    )}

                    {scoringMode === 'jd_based' && (
                      <motion.div variants={itemVariants} className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_25px_80px_rgba(34,197,94,0.1)] border border-emerald-400/30 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 border-b border-emerald-400/20">
                          <h2 className="text-xl font-semibold text-emerald-50 flex items-center">
                            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-400/40 mr-3">
                              <FileText className="w-5 h-5 text-emerald-300" />
                            </div>
                            Job Description <span className="text-red-400 ml-1">*</span>
                          </h2>
                          <p className="text-slate-300 mt-1 ml-12">Paste the complete job description for accurate matching</p>
                        </div>
                        <div className="p-6">
                          <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the full job description here including responsibilities, requirements, qualifications, and benefits..."
                            rows={8}
                            className="w-full px-4 py-3 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y min-h-[200px] bg-slate-800/50 text-slate-100 placeholder-slate-400 transition-all duration-300"
                          />
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-slate-400">
                              Required for JD-based scoring and analysis
                            </p>
                            <span className="text-xs text-slate-400">
                              {jobDescription.length} characters
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="text-center">
                      <button
                        onClick={() => { setHasShownCreditExhaustedAlert(false); analyzeResume(); }}
                        disabled={scoringMode === null || !extractionResult.text.trim() || (scoringMode === 'jd_based' && (!jobDescription.trim() || !jobTitle.trim()))}
                        className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 mx-auto shadow-xl hover:shadow-2xl ${
                          scoringMode === null || !extractionResult.text.trim() || (scoringMode === 'jd_based' && (!jobDescription.trim() || !jobTitle.trim()))
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-gradient-to-r from-neon-cyan-500 to-neon-purple-500 hover:from-neon-cyan-400 hover:to-neon-purple-400 text-white hover:shadow-neon-cyan transform hover:scale-105'
                        }`}
                      >
                        <TrendingUp className="w-6 h-6" />
                        <span>{isAuthenticated ? 'Analyze My Resume' : 'Sign In to Analyze'}</span>
                      </button>
                      {!isAuthenticated && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                          Sign in to access our AI-powered resume analysis
                        </p>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && scoreResult && (
              <div className="container-responsive py-8">
                <div className="max-w-5xl mx-auto space-y-6">
                  
                  {/* Cached Result Notice */}
                  {scoreResult.cached && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-4"
                    >
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-cyan-400 mr-2" />
                        <span className="text-cyan-300 font-medium">
                          Cached Result - Free analysis (expires {scoreResult.cache_expires_at ? new Date(scoreResult.cache_expires_at).toLocaleDateString() : 'soon'})
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Main Score Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-emerald-400/30 overflow-hidden shadow-[0_25px_80px_rgba(16,185,129,0.15)]"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-6 border-b border-emerald-400/20">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40">
                            <Award className="w-6 h-6 text-emerald-400" />
                          </div>
                          <h2 className="text-xl font-bold text-slate-100">Your Resume Score</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {extractionResult.extraction_mode === 'OCR' && (
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full font-medium border border-amber-400/30">
                              <Eye className="w-3 h-3 inline mr-1" />
                              OCR Used
                            </span>
                          )}
                          <span className={`px-3 py-1 text-xs rounded-full font-medium border ${
                            scoreResult.confidence === 'High' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' :
                            scoreResult.confidence === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' :
                            'bg-red-500/20 text-red-300 border-red-400/30'
                          }`}>
                            <Shield className="w-3 h-3 inline mr-1" />
                            {scoreResult.confidence} Confidence
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score Display */}
                    <div className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Score Circle */}
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="flex flex-col items-center"
                        >
                          <div className="relative w-40 h-40 mb-4">
                            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                              <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="10" />
                              <motion.circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                strokeWidth="10"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "0 314" }}
                                animate={{ strokeDasharray: `${(scoreResult.overall / 100) * 314} 314` }}
                                transition={{ duration: 1.5, ease: "easeOut" as const, delay: 0.3 }}
                                className={`${
                                  scoreResult.overall >= 80 ? 'stroke-emerald-400' :
                                  scoreResult.overall >= 60 ? 'stroke-amber-400' : 'stroke-red-400'
                                }`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.8 }}
                                  className={`text-5xl font-bold ${
                                    scoreResult.overall >= 80 ? 'text-emerald-400' :
                                    scoreResult.overall >= 60 ? 'text-amber-400' : 'text-red-400'
                                  }`}
                                >
                                  {scoreResult.overall}
                                </motion.div>
                                <div className="text-slate-400 text-sm">out of 100</div>
                              </div>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            scoreResult.overall >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                            scoreResult.overall >= 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
                            'bg-red-500/20 text-red-300 border border-red-400/30'
                          }`}>
                            {scoreResult.overall >= 80 ? 'Excellent' : scoreResult.overall >= 60 ? 'Good' : 'Needs Work'}
                          </div>
                        </motion.div>

                        {/* Match Quality & Interview Chance */}
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                          className="flex flex-col gap-4"
                        >
                          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-400/30">
                                <Award className="w-5 h-5 text-indigo-400" />
                              </div>
                              <span className="text-slate-400 text-sm">Match Quality</span>
                            </div>
                            <div className={`text-2xl font-bold ${
                              scoreResult.match_band === 'Excellent Match' ? 'text-emerald-400' :
                              scoreResult.match_band === 'Good Match' ? 'text-cyan-400' :
                              scoreResult.match_band === 'Fair Match' ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {scoreResult.match_band}
                            </div>
                          </div>
                          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                              </div>
                              <span className="text-slate-400 text-sm">Interview Chance</span>
                            </div>
                            <div className="text-2xl font-bold text-emerald-400">
                              {scoreResult.interview_probability_range}
                            </div>
                          </div>
                        </motion.div>

                        {/* Analysis Summary */}
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                          className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
                        >
                          <h3 className="text-lg font-semibold text-slate-100 mb-3">Analysis Summary</h3>
                          <p className="text-slate-300 text-sm leading-relaxed mb-4">{scoreResult.analysis}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3">
                              <div className="text-emerald-400 font-bold text-lg">{scoreResult.keyStrengths.length}</div>
                              <div className="text-emerald-300/70 text-xs">Strengths</div>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-3">
                              <div className="text-amber-400 font-bold text-lg">{scoreResult.improvementAreas.length}</div>
                              <div className="text-amber-300/70 text-xs">To Improve</div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Detailed Breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-indigo-400/30 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 border-b border-indigo-400/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/40">
                          <BarChart3 className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-100">Detailed Breakdown</h2>
                          <p className="text-slate-400 text-sm">16-metric comprehensive analysis</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scoreResult.breakdown.map((metric, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-indigo-400/30 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-slate-200 text-sm">{metric.name}</h4>
                              <span className="text-xs text-slate-500">{metric.weight_pct}% weight</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-xl font-bold ${
                                (metric.score / metric.max_score) >= 0.8 ? 'text-emerald-400' :
                                (metric.score / metric.max_score) >= 0.6 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {metric.score}
                              </span>
                              <span className="text-slate-500">/ {metric.max_score}</span>
                              <span className="ml-auto text-xs text-indigo-400">+{metric.contribution.toFixed(1)} pts</span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2 mb-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(metric.score / metric.max_score) * 100}%` }}
                                transition={{ duration: 0.8, delay: 0.5 + index * 0.05 }}
                                className={`h-2 rounded-full ${
                                  (metric.score / metric.max_score) >= 0.8 ? 'bg-emerald-500' :
                                  (metric.score / metric.max_score) >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                              />
                            </div>
                            <p className="text-xs text-slate-400">{metric.details}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Recommendations */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-purple-400/30 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 border-b border-purple-400/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/40">
                          <Lightbulb className="w-6 h-6 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-100">Recommendations</h2>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {scoreResult.recommendations.length > 0 ? (
                          scoreResult.recommendations.map((rec, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                              className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-4 border border-slate-700/30"
                            >
                              <div className="p-1 rounded-full bg-purple-500/20 mt-0.5">
                                <ArrowRight className="w-4 h-4 text-purple-400" />
                              </div>
                              <span className="text-slate-300 text-sm">{rec}</span>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-slate-400 italic text-center py-4">Your resume looks great! No specific recommendations.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* CTA Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                  >
                    <button
                      onClick={handleCheckAnotherResume}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                    >
                      Check Another Resume
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onNavigateBack}
                      className="px-8 py-3 bg-slate-800 text-slate-200 font-semibold rounded-xl hover:bg-slate-700 transition-all duration-300 border border-slate-700"
                    >
                      Back to Home
                    </button>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

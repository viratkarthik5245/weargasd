// src/components/ResumeOptimizer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FileText, AlertCircle, Plus, Sparkles, ArrowLeft, X, Send, Briefcase, Building2, Target, Zap, CheckCircle } from 'lucide-react';
import { AnimatedCard, GradientButton, FloatingParticles, ChristmasSnow } from './ui';
import { ResumePreview } from './ResumePreview';
import { ResumeExportSettings } from './ResumeExportSettings';
import { ProjectAnalysisModal } from './ProjectAnalysisModal';
import { MobileOptimizedInterface } from './MobileOptimizedInterface';
import { ProjectEnhancement } from './ProjectEnhancement';
import { SubscriptionPlans } from './payment/SubscriptionPlans';
import { SubscriptionStatus } from './payment/SubscriptionStatus';
import { MissingSectionsModal } from './MissingSectionsModal';
import { InputWizard } from './InputWizard';
import { LoadingAnimation } from './LoadingAnimation';
import { optimizeResume } from '../services/geminiService';
import { generateBeforeScore, generateAfterScore, getDetailedResumeScore, reconstructResumeText } from '../services/scoringService';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService'; // ADDED: Import authService
import { ResumeData, UserType, MatchScore, DetailedScore, ExtractionResult, ScoringMode } from '../types/resume';
import { ExportOptions, defaultExportOptions } from '../types/export';
import { exportToPDF, exportToWord } from '../utils/exportUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExportButtons } from './ExportButtons';
import { ResumePreviewControls } from './ResumePreviewControls';
import { FullScreenPreviewModal } from './FullScreenPreviewModal';
import { jobsService } from '../services/jobsService';

// src/components/ResumeOptimizer.tsx
const cleanResumeText = (text: string): string => {
  let cleaned = text;
  // Remove "// Line XXX" patterns anywhere in the text
  cleaned = cleaned.replace(/\/\/\s*Line\s*\d+\s*/g, '');
  // Remove "// MODIFIED:" patterns anywhere in the text (e.g., "// MODIFIED: listStyleType to 'none'")
  cleaned = cleaned.replace(/\/\/\s*MODIFIED:\s*.*?(?=\n|$)/g, ''); // Catches the whole comment line
  // Also remove any remaining single-line comments that might have slipped through or were on their own line
  cleaned = cleaned.split('\n')
                   .filter(line => !line.trim().startsWith('//')) // Remove lines that start with //
                   .join('\n');
  return cleaned;
};


interface ResumeOptimizerProps {
  isAuthenticated: boolean;
  onShowAuth: () => void;
  onShowProfile: (mode?: 'profile' | 'wallet') => void;
  onNavigateBack: () => void;
  userSubscription: any;
  refreshUserSubscription: () => Promise<void>;
  onShowPlanSelection: (featureId?: string) => void;
  toolProcessTrigger: (() => void) | null;
  setToolProcessTrigger: React.Dispatch<React.SetStateAction<(() => void) | null>>;
}

type ManualProject = {
  title: string;
  startDate: string;
  endDate: string;
  techStack: string[];
  oneLiner: string;
};

// --- NEW CONSTANT ---
const MAX_OPTIMIZER_INPUT_LENGTH = 50000; // Match the constant in geminiService.ts

const ResumeOptimizer: React.FC<ResumeOptimizerProps> = ({
  isAuthenticated,
  onShowAuth,
  onShowProfile,
  onNavigateBack,
  userSubscription,
  refreshUserSubscription,
  onShowPlanSelection,
  toolProcessTrigger,
  setToolProcessTrigger
}) => {
  const { user, revalidateUserSession } = useAuth();
  const { isChristmasMode, colors } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const jobContext = location.state as { jobId?: string; jobDescription?: string; roleTitle?: string; companyName?: string; fromJobApplication?: boolean } | null;
  const jobIdFromContext = jobContext?.jobId;

  const [extractionResult, setExtractionResult] = useState<ExtractionResult>({ text: '', extraction_mode: 'TEXT', trimmed: false });
  const [jobDescription, setJobDescription] = useState(jobContext?.jobDescription || '');
  const [targetRole, setTargetRole] = useState(jobContext?.roleTitle || '');
  const [userType, setUserType] = useState<UserType>('fresher');
  const [scoringMode, setScoringMode] = useState<ScoringMode>('general');
  const [autoScoreOnUpload, setAutoScoreOnUpload] = useState(true);

  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [parsedResumeData, setParsedResumeData] = useState<ResumeData | null>(null);
  const [pendingResumeData, setPendingResumeData] = useState<ResumeData | null>(null);

  const [beforeScore, setBeforeScore] = useState<MatchScore | null>(null);
  const [afterScore, setAfterScore] = useState<MatchScore | null>(null);
  const [initialResumeScore, setInitialResumeScore] = useState<DetailedScore | null>(null);
  const [finalResumeScore, setFinalResumeScore] = useState<DetailedScore | null>(null);
  const [changedSections, setChangedSections] = useState<string[]>([]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [isProcessingMissingSections, setIsProcessingMissingSections] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume'>('resume');
  const [currentStep, setCurrentStep] = useState(0);

  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
  const [showMissingSectionsModal, setShowMissingSectionsModal] = useState(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);

  const [showMobileInterface, setShowMobileInterface] = useState(false);
  const [showProjectMismatch, setShowProjectMismatch] = useState(false);
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const [showManualProjectAdd, setShowManualProjectAdd] = useState(false);
  const [lowScoringProjects, setLowScoringProjects] = useState<any[]>([]);
  const [manualProject, setManualProject] = useState<ManualProject>({
    title: '',
    startDate: '',
    endDate: '',
    techStack: [],
    oneLiner: ''
  });
  const [newTechStack, setNewTechStack] = useState('');

  const [showProjectEnhancement, setShowProjectEnhancement] = useState(false);

  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [walletRefreshKey, setWalletRefreshKey] = useState(0);

  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  const [exportOptions, setExportOptions] = useState<ExportOptions>(defaultExportOptions);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'pdf' | 'word' | null;
    status: 'success' | 'error' | null;
    message: string;
  }>({ type: null, status: null, message: '' });

  const [optimizationInterrupted, setOptimizationInterrupted] = useState(false);
  const [jobApplicationLink, setJobApplicationLink] = useState<string | null>(null);

  const [previewZoom, setPreviewZoom] = useState(0.8);
  const [showFullScreenPreview, setShowFullScreenPreview] = useState(false);
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2.5;

  const userName = (user as any)?.user_metadata?.name || '';
  const userEmail = user?.email || ''; // Correctly accesses email from user object
  const userPhone = user?.phone || ''; // Correctly accesses phone from user object
  const userLinkedin = user?.linkedin || ''; // Correctly accesses linkedin from user object
  const userGithub = user?.github || ''; // Correctly accesses github from user object

  const handleStartNewResume = useCallback(() => { // Memoize
    setOptimizedResume(null);
    setExtractionResult({ text: '', extraction_mode: 'TEXT', trimmed: false });
    setJobDescription('');
    setTargetRole('');
    setUserType('fresher');
    setBeforeScore(null);
    setAfterScore(null);
    setInitialResumeScore(null);
    setFinalResumeScore(null);
    setParsedResumeData(null);
    setManualProject({ title: '', startDate: '', endDate: '', techStack: [], oneLiner: '' });
    setNewTechStack('');
    setLowScoringProjects([]);
    setChangedSections([]);
    setCurrentStep(0);
    setActiveTab('resume');
    setShowMobileInterface(false);
    setOptimizationInterrupted(false);
  }, []);

  const checkSubscriptionStatus = useCallback(async () => { // Memoize
    if (!user) return;
    try {
      const userSubscriptionData = await paymentService.getUserSubscription(user.id);
      setSubscription(userSubscriptionData);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkSubscriptionStatus();
    } else {
      setLoadingSubscription(false);
    }
  }, [isAuthenticated, user, checkSubscriptionStatus]); // Add checkSubscriptionStatus to dependencies

  useEffect(() => {
    let isMounted = true;

    if (!jobContext?.fromJobApplication || !jobIdFromContext) {
      setJobApplicationLink(null);
      return () => {
        isMounted = false;
      };
    }

    const fetchJobLink = async () => {
      try {
        const jobDetails = await jobsService.getJobListingById(jobIdFromContext);
        if (isMounted) {
          const link = jobDetails?.application_link?.trim();
          setJobApplicationLink(link && link.length > 0 ? link : null);
        }
      } catch (error) {
        console.error('ResumeOptimizer: Failed to fetch job application link', error);
        if (isMounted) {
          setJobApplicationLink(null);
        }
      }
    };

    fetchJobLink();

    return () => {
      isMounted = false;
    };
  }, [jobContext?.fromJobApplication, jobIdFromContext]);

  useEffect(() => {
    if (extractionResult.text.trim().length > 0 && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [extractionResult.text, currentStep]);

  const handleExternalApply = useCallback(
    (resumeData?: ResumeData | null) => {
      if (jobApplicationLink) {
        const newWindow = window.open(jobApplicationLink, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          console.warn('ResumeOptimizer: popup blocked when trying to open job application link.');
        }
        return;
      }

      if (jobIdFromContext) {
        const navigationState = resumeData
          ? {
              state: {
                optimizedResumeData: resumeData,
                fromOptimizer: true
              }
            }
          : undefined;
        navigate(`/jobs/${jobIdFromContext}/apply-form`, navigationState);
        return;
      }

      navigate('/jobs');
    },
    [jobApplicationLink, jobIdFromContext, navigate]
  );
const checkForMissingSections = useCallback((resumeData: ResumeData): string[] => {
  const missing: string[] = [];
  
  // Helper function to check if content is placeholder/low quality
  const isPlaceholderContent = (text: string): boolean => {
    const placeholderPatterns = [
      /placeholder/i,
      /example/i,
      /sample/i,
      /\[.*\]/,  // [brackets]
      /your .+ here/i,
      /^(n\/a|na|none|nil)$/i,
      /^-+$/,  // just dashes
      /^\s*$/  // empty or whitespace
    ];
    return placeholderPatterns.some(pattern => pattern.test(text));
  };

  // Check work experience - must have at least 1 valid entry
  if (!resumeData.workExperience || 
      resumeData.workExperience.length === 0 || 
      resumeData.workExperience.every(exp => 
        !exp.role?.trim() || 
        !exp.company?.trim() || 
        isPlaceholderContent(exp.role) || 
        isPlaceholderContent(exp.company) ||
        !exp.bullets || 
        exp.bullets.length === 0 ||
        exp.bullets.every(b => !b.trim() || isPlaceholderContent(b))
      )) {
    missing.push('workExperience');
  }

  // Check projects - must have at least 1 valid entry with bullets
  if (!resumeData.projects || 
      resumeData.projects.length === 0 || 
      resumeData.projects.every(proj => 
        !proj.title?.trim() || 
        isPlaceholderContent(proj.title) ||
        !proj.bullets || 
        proj.bullets.length === 0 ||
        proj.bullets.every(b => !b.trim() || isPlaceholderContent(b))
      )) {
    missing.push('projects');
  }

  // Check skills - must have at least 1 category with real skills
  if (!resumeData.skills || 
      resumeData.skills.length === 0 || 
      resumeData.skills.every(skillCat => 
        !skillCat.category?.trim() || 
        !skillCat.list || 
        skillCat.list.length === 0 ||
        skillCat.list.every(s => !s.trim() || isPlaceholderContent(s))
      )) {
    missing.push('skills');
  }

  // Check education - must have at least 1 complete entry
  if (!resumeData.education || 
      resumeData.education.length === 0 || 
      resumeData.education.every(edu => 
        !edu.degree?.trim() || 
        !edu.school?.trim() || 
        !edu.year?.trim() ||
        isPlaceholderContent(edu.degree) ||
        isPlaceholderContent(edu.school)
      )) {
    missing.push('education');
  }

  // Check certifications - must have at least 1 real certification (handle flexible shapes)
  if (!resumeData.certifications || 
      resumeData.certifications.length === 0 || 
      resumeData.certifications.every(cert => {
        const c: any = cert as any;
        const certText = typeof cert === 'string'
          ? cert
          : (c?.title || c?.name || c?.text || c?.value || '');
        return !String(certText).trim() || isPlaceholderContent(String(certText));
      })) {
    missing.push('certifications');
  }

  // Contact details - require phone AND email with valid formats
  const phoneOk = typeof resumeData.phone === 'string' && 
                  resumeData.phone.trim().length > 0 && 
                  !isPlaceholderContent(resumeData.phone) &&
                  resumeData.phone.length >= 10; // Basic length check
  
  const emailOk = typeof resumeData.email === 'string' && 
                  resumeData.email.trim().length > 0 && 
                  !isPlaceholderContent(resumeData.email) &&
                  resumeData.email.includes('@') && 
                  resumeData.email.includes('.');
  
  if (!phoneOk || !emailOk) {
    missing.push('contactDetails');
  }

  return missing;
}, []);

  const proceedWithFinalOptimization = useCallback(async (resumeData: ResumeData, initialScore: DetailedScore, accessToken: string) => { // Memoize
    try {
      setIsOptimizing(true);
      const finalOptimizedResume = await optimizeResume(
        reconstructResumeText(resumeData),
        jobDescription,
        userType,
        userName,
        userEmail,
        userPhone,
        userLinkedin,
        userGithub,
        undefined,
        undefined,
        targetRole
      );
      const beforeScoreData = generateBeforeScore(reconstructResumeText(resumeData));
      setBeforeScore(beforeScoreData);
      // Merge in user's saved certifications from profile if optimizer returned none
      try {
        if ((!finalOptimizedResume.certifications || finalOptimizedResume.certifications.length === 0) && user) {
          const profile = await authService.fetchUserProfile(user.id);
          const normalizeCerts = (items: any[]): (string | { title: string; description: string })[] => {
            return (items || [])
              .map((item: any) => {
                if (typeof item === 'string') {
                  const s = item.trim();
                  return s.length > 0 ? s : null;
                }
                if (item && typeof item === 'object') {
                  const primary: string = (item.title || item.name || item.certificate || item.text || item.value || item.issuer || item.provider || '').toString().trim();
                  const desc: string = (item.description || item.issuer || item.provider || '').toString().trim();
                  if (!primary && !desc) return null;
                  return { title: primary || desc, description: desc && desc !== primary ? desc : '' };
                }
                return null;
              })
              .filter(Boolean) as (string | { title: string; description: string })[];
          };
          const profileCerts = normalizeCerts((profile as any)?.certifications_details || []);
          if (profileCerts.length > 0) {
            const seen = new Set<string>();
            finalOptimizedResume.certifications = (finalOptimizedResume.certifications || []).concat(
              profileCerts.filter((c: any) => {
                const key = typeof c === 'string' ? c.toLowerCase() : (c.title || c.description || '').toLowerCase();
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
              })
            );
          }
        }
      } catch (mergeErr) {
        console.warn('ResumeOptimizer: Could not merge profile certifications:', mergeErr);
      }

      const finalScore = await getDetailedResumeScore(finalOptimizedResume, jobDescription, setIsCalculatingScore);
      setFinalResumeScore(finalScore);
      const afterScoreData = await generateAfterScore(finalOptimizedResume, jobDescription);
      setAfterScore(afterScoreData);
      setChangedSections(['workExperience', 'education', 'projects', 'skills', 'certifications']);
      const optimizationResult = await paymentService.useOptimization(user!.id);
      if (optimizationResult.success) {
        await checkSubscriptionStatus();
        setWalletRefreshKey(prevKey => prevKey + 1);
        // ADDED: Increment resumes_created_count after successful optimization
        if (user) {
          try {
            console.log('ResumeOptimizer: Incrementing resume count for user:', user.id);
            await authService.incrementResumesCreatedCount(user.id);
            // ADDED: Increment global resumes created count
            await authService.incrementGlobalResumesCreatedCount();
            await revalidateUserSession(); // Revalidate session to update user context with new count
            console.log('ResumeOptimizer: Both individual and global resume counts incremented and session revalidated');
          } catch (countError) {
            console.error('ResumeOptimizer: Failed to increment resume counts:', countError);
          }
        }
      } else {
        console.error('Failed to decrement optimization usage:', optimizationResult.error);
      }
      if (window.innerWidth < 768) {
        setShowMobileInterface(true);
      }
      setActiveTab('resume');
      setOptimizedResume(finalOptimizedResume);
    } catch (error) {
      console.error('Error in final optimization pass:', error);
      alert('Failed to complete resume optimization. Please try again.');
    } finally {
      setIsOptimizing(false);
      setIsCalculatingScore(false);
    }
  }, [jobDescription, userType, userName, userEmail, userPhone, userLinkedin, userGithub, targetRole, user, checkSubscriptionStatus, revalidateUserSession]); // Dependencies for memoized function

  const handleInitialResumeProcessing = useCallback(async (resumeData: ResumeData, accessToken: string) => { // Memoize
    try {
      setIsCalculatingScore(true);
      const initialScore = await getDetailedResumeScore(resumeData, jobDescription, setIsCalculatingScore);
      setInitialResumeScore(initialScore);
      setOptimizedResume(resumeData);
      setParsedResumeData(resumeData);
      if (resumeData.projects && resumeData.projects.length > 0) {
        setShowProjectAnalysis(true);
      } else {
        await proceedWithFinalOptimization(resumeData, initialScore, accessToken);
      }
    } catch (error) {
      console.error('Error in initial resume processing:', error);
      alert('Failed to process resume. Please try again.');
    } finally {
      setIsCalculatingScore(false);
    }
  }, [jobDescription, proceedWithFinalOptimization]); // Dependencies for memoized function

 const continueOptimizationProcess = useCallback(async (resumeData: ResumeData, accessToken: string) => { // Memoize
  try {
    await handleInitialResumeProcessing(resumeData, accessToken);
  } catch (error) {
    console.error('Error in optimization process:', error);
    alert('Failed to continue optimization. Please try again.');
    setIsOptimizing(false);
  }

  // ✅ FIXED: changed all baseResume references to resumeData
  const missing = checkForMissingSections(resumeData);

  // DEBUG: Log missing sections detection
  console.log('🔍 Missing Sections Check:', {
    totalMissing: missing.length,
    missingSections: missing,
    resumeData: {
      hasWorkExperience: resumeData.workExperience?.length > 0,
      hasProjects: resumeData.projects?.length > 0,
      hasSkills: resumeData.skills?.length > 0,
      hasEducation: resumeData.education?.length > 0,
      hasCertifications: resumeData.certifications?.length > 0,
      hasPhone: !!resumeData.phone,
      hasEmail: !!resumeData.email
    }
  });

  if (missing.length > 0) {
    console.log('✅ Opening Missing Sections Modal');
    setMissingSections(missing);
    setPendingResumeData(resumeData);
    setShowMissingSectionsModal(true);
    setIsOptimizing(false);
    return;
  }
}, [handleInitialResumeProcessing]); // Dependencies for memoized function


  const handleMissingSectionsProvided = useCallback(async (data: any) => {
    setIsProcessingMissingSections(true);
    try {
      if (!pendingResumeData) {
        throw new Error('No pending resume data to update.');
      }
      const updatedResume: ResumeData = {
        ...pendingResumeData,
        ...(data.workExperience && data.workExperience.length > 0 && { workExperience: data.workExperience }),
        ...(data.projects && data.projects.length > 0 && { projects: data.projects }),
        ...(data.skills && data.skills.length > 0 && { skills: data.skills }),
        ...(data.education && data.education.length > 0 && { education: data.education }),
        ...(data.certifications && data.certifications.length > 0 && { certifications: data.certifications }), // Add certifications
        ...(data.summary && { summary: data.summary }),
        ...(data.contactDetails && {
          phone: data.contactDetails.phone || pendingResumeData.phone,
          email: data.contactDetails.email || pendingResumeData.email,
          linkedin: data.contactDetails.linkedin || pendingResumeData.linkedin,
          github: data.contactDetails.github || pendingResumeData.github
        })
      };
      setShowMissingSectionsModal(false);
      setMissingSections([]);
      setPendingResumeData(null);
      setIsOptimizing(false);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || '';
      await handleInitialResumeProcessing(updatedResume, accessToken);
    } catch (error) {
      console.error('Error processing missing sections:', error);
      alert('Failed to process the provided information. Please try again.');
    } finally {
      setIsProcessingMissingSections(false);
    }
  }, [pendingResumeData, handleInitialResumeProcessing]);

  const handleOptimize = useCallback(async () => { // Memoize
    if (!extractionResult.text.trim() || !jobDescription.trim()) {
      alert('Please provide both resume content and job description');
      return;
    }
    if (!user) {
      alert('User information not available. Please sign in again.');
      onShowAuth();
      return;
    }

    // --- NEW: Input Length Validation ---
    const combinedInputLength = extractionResult.text.length + jobDescription.length;
    if (combinedInputLength > MAX_OPTIMIZER_INPUT_LENGTH) {
      alert(
        `Your combined resume and job description are too long (${combinedInputLength} characters). ` +
        `The maximum allowed is ${MAX_OPTIMIZER_INPUT_LENGTH} characters. Please shorten your input.`
      );
      return;
    }
    // --- END NEW ---

    // Clear any previous interruption state at the start of optimization attempt
    setOptimizationInterrupted(false);
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        alert('Your session has expired. Please sign in again.');
        onShowAuth();
        return;
      }
      const session = refreshData.session;
      if (!session || !session.access_token) {
        alert('Your session has expired. Please sign in again.');
        onShowAuth();
        return;
      }
      if (!userSubscription || (userSubscription.optimizationsTotal - userSubscription.optimizationsUsed) <= 0) {
        // Re-fetch userSubscription here to ensure it's the absolute latest before checking credits
        const latestUserSubscription = await paymentService.getUserSubscription(user.id);
        if (!latestUserSubscription || (latestUserSubscription.optimizationsTotal - latestUserSubscription.optimizationsUsed) <= 0) {
        onShowPlanSelection('optimizer');
        return;
        }
      }
      setIsOptimizing(true);
      try {
        // ⬇️ NEW LOGIC: prefer already-parsed + complete data; skip re-parsing if possible
        let baseResume: ResumeData;
        let processedResumeText = cleanResumeText(extractionResult.text); // Add this line to clean the text

        if (parsedResumeData && checkForMissingSections(parsedResumeData).length === 0) {
          // Already have a complete parsed resume (perhaps after user filled missing sections)
          baseResume = parsedResumeData;
        } else {
          // Parse from extractionResult.text via AI as before
          const parsedResume = await optimizeResume(
           extractionResult.text, // This is where the cleaned text should be passed if you want to use it
            jobDescription,
            userType,
            userName,
            userEmail,
            userPhone,
            userLinkedin,
            userGithub,
            undefined,
            undefined,
            targetRole
          );
          baseResume = parsedResume;
          setParsedResumeData(parsedResume);
        }

        const missing = checkForMissingSections(baseResume);
        if (missing.length > 0) {
          setMissingSections(missing);
          setPendingResumeData(baseResume);
          setShowMissingSectionsModal(true);
          setIsOptimizing(false);
          return;
        }

        await continueOptimizationProcess(baseResume, session.access_token);
      } catch (error: any) {
        console.error('Error optimizing resume:', error);
        alert('Failed to optimize resume. Please try again.');
      } finally {
        setIsOptimizing(false);
      }
    } catch (error: any) {
      console.error('Error during session validation or subscription check:', error);
      alert(`An error occurred: ${error.message || 'Failed to validate session or check subscription.'}`);
      setIsOptimizing(false);
    }
  }, [
    extractionResult,
    jobDescription,
    user, // Keep user as a dependency
    onShowAuth,
    onShowPlanSelection, // Keep onShowPlanSelection as a dependency
    userSubscription, // Keep userSubscription as a dependency for the useEffect below
    userType,
    userName,
    userEmail,
    userPhone,
    userLinkedin,
    userGithub,
    targetRole,
    checkForMissingSections,
    continueOptimizationProcess,
    parsedResumeData // ⬅️ added dependency because we branch on it
  ]); // Dependencies for memoized function

  useEffect(() => {
    setToolProcessTrigger(() => handleOptimize);
    return () => {
      setToolProcessTrigger(null);
    };
  }, [setToolProcessTrigger, handleOptimize]);

  useEffect(() => {
    // This useEffect should now primarily reset the flag, not re-trigger the process
    // The actual re-triggering will be handled by toolProcessTrigger from App.tsx
    if (optimizationInterrupted && userSubscription && (userSubscription.optimizationsTotal - userSubscription.optimizationsUsed) > 0) {
      console.log('ResumeOptimizer: Optimization was interrupted, credits now available. Resetting flag.');
      setOptimizationInterrupted(false); // Reset the flag
    }
  }, [optimizationInterrupted, refreshUserSubscription, userSubscription, handleOptimize]);

  const handleProjectMismatchResponse = useCallback(async (proceed: boolean) => { // Memoize
    setShowProjectMismatch(false);
    if (proceed) {
      setShowProjectOptions(true);
    } else {
      if (parsedResumeData && initialResumeScore) {
        const { data: sessionData } = await supabase.auth.getSession();
        await proceedWithFinalOptimization(parsedResumeData, initialResumeScore, sessionData?.session?.access_token || '');
      }
    }
  }, [parsedResumeData, initialResumeScore, proceedWithFinalOptimization]);

  const handleProjectOptionSelect = useCallback((option: 'manual' | 'ai') => { // Memoize
    setShowProjectOptions(false);
    if (option === 'manual') {
      setShowManualProjectAdd(true);
    } else {
      setShowProjectEnhancement(true);
    }
  }, []);

  const addTechToStack = useCallback(() => { // Memoize
    if (newTechStack.trim() && !manualProject.techStack.includes(newTechStack.trim())) {
      setManualProject(prev => ({ ...prev, techStack: [...prev.techStack, newTechStack.trim()] }));
      setNewTechStack('');
    }
  }, [newTechStack, manualProject.techStack]);

  const removeTechFromStack = useCallback((tech: string) => { // Memoize
    setManualProject(prev => ({ ...prev, techStack: prev.techStack.filter(t => t !== tech) }));
  }, []);

  const generateProjectDescription = useCallback(async (project: ManualProject, jd: string): Promise<string> => { // Memoize
    return `• Developed ${project.title} using ${project.techStack.join(', ')} technologies
• Implemented core features and functionality aligned with industry best practices
• Delivered scalable solution with focus on performance and user experience`;
  }, []);

  const handleManualProjectSubmit = useCallback(async () => { // Memoize
    if (!manualProject.title || manualProject.techStack.length === 0 || !parsedResumeData) {
      alert('Please provide project title and tech stack.');
      return;
    }
    setIsOptimizing(true);
    try {
      const projectDescriptionText = await generateProjectDescription(manualProject, jobDescription);
      const newProject = {
        title: manualProject.title,
        bullets: projectDescriptionText.split('\n').filter(line => line.trim().startsWith('•')).map(line => line.replace('•', '').trim()),
        githubUrl: ''
      };
      const updatedResume = { ...parsedResumeData, projects: [...(parsedResumeData.projects || []), newProject] };
      setShowManualProjectAdd(false);
      const { data: sessionData } = await supabase.auth.getSession();
      if (initialResumeScore) {
        await proceedWithFinalOptimization(updatedResume, initialResumeScore, sessionData?.session?.access_token || '');
      } else {
        const newInitialScore = await getDetailedResumeScore(updatedResume, jobDescription, setIsCalculatingScore);
        await proceedWithFinalOptimization(updatedResume, newInitialScore, sessionData?.session?.access_token || '');
      }
    } catch (error) {
      console.error('Error creating manual project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  }, [manualProject, parsedResumeData, generateProjectDescription, jobDescription, initialResumeScore, proceedWithFinalOptimization]); // Dependencies for memoized function

  const generateScoresAfterProjectAdd = useCallback(async (updatedResume: ResumeData, accessToken: string) => { // Memoize
    try {
      setIsCalculatingScore(true);
      const freshInitialScore = await getDetailedResumeScore(updatedResume, jobDescription, setIsCalculatingScore);
      setInitialResumeScore(freshInitialScore);
      await proceedWithFinalOptimization(updatedResume, freshInitialScore, accessToken);
    } catch (error) {
      console.error('Error generating scores after project add:', error);
      alert('Failed to generate updated scores. Please try again.');
    } finally {
      setIsCalculatingScore(false);
    }
  }, [jobDescription, proceedWithFinalOptimization]); // Dependencies for memoized function

  const handleProjectsUpdated = useCallback(async (updatedResumeData: ResumeData) => { // Memoize
    setOptimizedResume(updatedResumeData);
    setParsedResumeData(updatedResumeData);
    const { data: sessionData } = await supabase.auth.getSession();
    if (initialResumeScore) {
      await proceedWithFinalOptimization(updatedResumeData, initialResumeScore, sessionData?.session?.access_token || '');
    } else {
      await generateScoresAfterProjectAdd(updatedResumeData, sessionData?.session?.access_token || '');
    }
  }, [initialResumeScore, proceedWithFinalOptimization, generateScoresAfterProjectAdd]); // Dependencies for memoized function

  const handleSubscriptionSuccess = useCallback(() => { // Memoize
    checkSubscriptionStatus();
    onShowPlanSelection();
    setWalletRefreshKey(prevKey => prevKey + 1);
  }, [checkSubscriptionStatus, onShowPlanSelection]); // Dependencies for memoized function

  const handleZoomIn = useCallback(() => {
    setPreviewZoom(prev => Math.min(prev + 0.1, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPreviewZoom(prev => Math.max(prev - 0.1, MIN_ZOOM));
  }, []);

  const handleFitWidth = useCallback(() => {
    setPreviewZoom(1.4);
  }, []);

  const handleFullScreen = useCallback(() => {
    setShowFullScreenPreview(true);
  }, []);

  const handleExportFile = useCallback(async (options: ExportOptions, format: 'pdf' | 'word') => {
    if (!optimizedResume) return;
    
    // ADDED: Debug logging for export data
    console.log('[ResumeOptimizer] handleExportFile - optimizedResume data being exported:', optimizedResume);
    console.log('[ResumeOptimizer] Contact details in export data:');
    console.log('  - name:', optimizedResume.name);
    console.log('  - phone:', optimizedResume.phone);
    console.log('  - email:', optimizedResume.email);
    console.log('  - linkedin:', optimizedResume.linkedin);
    console.log('  - github:', optimizedResume.github);
    console.log('  - location:', optimizedResume.location);
    
    if (format === 'pdf') {
      if (isExportingPDF || isExportingWord) return;
      setIsExportingPDF(true);
    } else {
      if (isExportingWord || isExportingPDF) return;
      setIsExportingWord(true);
    }
    
    setExportStatus({ type: null, status: null, message: '' });
    
    try {
      if (format === 'pdf') {
        await exportToPDF(optimizedResume, userType, options);
      } else {
        await exportToWord(optimizedResume, userType);
      }
      
      setExportStatus({
        type: format,
        status: 'success',
        message: `${format.toUpperCase()} exported successfully!`
      });
      
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 3000);
    } catch (error) {
      console.error(`${format.toUpperCase()} export failed:`, error);
      setExportStatus({
        type: format,
        status: 'error',
        message: `${format.toUpperCase()} export failed. Please try again.`
      });
      
      setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 5000);
    } finally {
      if (format === 'pdf') {
        setIsExportingPDF(false);
      } else {
        setIsExportingWord(false);
      }
    }
  }, [optimizedResume, userType, isExportingPDF, isExportingWord]);

  if (showMobileInterface && optimizedResume) {
    const mobileSections = [
      {
        id: 'resume',
        title: 'Optimized Resume',
        icon: <FileText className="w-5 h-5" />,
        component: (
          <>
            {optimizedResume ? <ResumePreview resumeData={optimizedResume} userType={userType} /> : null}
            {optimizedResume && (
              <>
                <ExportButtons
                  resumeData={optimizedResume}
                  userType={userType}
                  targetRole={targetRole}
                  onShowProfile={onShowProfile}
                  walletRefreshKey={walletRefreshKey}
                />
                {jobContext?.fromJobApplication && jobContext.jobId && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border-2 border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                          Resume Optimized Successfully!
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Your resume has been optimized for {jobContext.roleTitle} at {jobContext.companyName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExternalApply(optimizedResume)}
                      className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105"
                    >
                      <Send className="w-6 h-6" />
                      <span>Apply Now to {jobContext.companyName}</span>
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                      Make sure to download your optimized resume before applying
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        ),
        resumeData: optimizedResume
      }
    ];
    return <MobileOptimizedInterface sections={mobileSections} onStartNewResume={handleStartNewResume} />;
  }

  if (isOptimizing || isCalculatingScore || isProcessingMissingSections) {
    let loadingMessage = 'Optimizing Your Resume...';
    let submessage = 'Please wait while our AI analyzes your resume and job description to generate the best possible match.';
    if (isCalculatingScore) {
      loadingMessage = 'OPTIMIZING RESUME...';
      submessage = 'Our AI is evaluating your resume based on comprehensive criteria.';
    } else if (isProcessingMissingSections) {
      loadingMessage = 'Processing Your Information...';
      submessage = "We're updating your resume with the new sections you provided.";
    }
    return <LoadingAnimation message={loadingMessage} submessage={submessage} />;
  }
  return (
   <div className={`min-h-screen relative overflow-hidden pb-16 lg:pl-16 ${
      isChristmasMode
        ? 'bg-gradient-to-b from-[#1a0a0f] via-[#0f1a0f] to-[#020617]'
        : 'bg-gradient-to-b from-slate-900 via-slate-950 to-[#020617]'
    }`}>
      {/* Radial Glow Overlay - Subtle professional effect */}
      <div className={`pointer-events-none absolute inset-0 ${
        isChristmasMode
          ? 'bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(34,197,94,0.08),transparent_50%)]'
          : 'bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.08),transparent_50%)]'
      }`} />

      {/* Floating Particles */}
      <FloatingParticles count={15} />

      {/* Christmas Snow */}
      {isChristmasMode && <ChristmasSnow count={40} />}

      <div className="container-responsive py-8 relative z-10">
        {!optimizedResume ? (
          <>
            <button
              onClick={() => jobContext?.fromJobApplication && jobContext.jobId ? navigate(`/jobs/${jobContext.jobId}/apply`) : navigate('/')}
              className="lg:hidden mb-6 bg-gradient-to-r from-neon-cyan-500 to-neon-blue-500 text-white hover:from-neon-cyan-400 hover:to-neon-blue-400 active:from-neon-cyan-600 active:to-neon-blue-600 shadow-md hover:shadow-neon-cyan py-3 px-5 rounded-xl inline-flex items-center space-x-2 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:block">{jobContext?.fromJobApplication ? 'Back to Job' : 'Back to Home'}</span>
            </button>

            {jobContext?.fromJobApplication && jobContext.roleTitle && jobContext.companyName && (
              <div className="mb-6 bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-blue-900/40 rounded-2xl p-6 border-2 border-cyan-500/30 shadow-xl backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-bold text-slate-100">Optimizing Resume For:</h3>
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-md">
                        JOB-SPECIFIC
                      </span>
                    </div>
                    <p className="text-xl font-semibold text-cyan-300">{jobContext.roleTitle}</p>
                    <p className="text-sm text-slate-400 flex items-center space-x-1 mt-1">
                      <Building2 className="w-4 h-4" />
                      <span>{jobContext.companyName}</span>
                    </p>
                    <div className="mt-3 flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-xs text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded-full border border-cyan-500/30">
                        <Target className="w-3 h-3" />
                        <span>Tailored optimization</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full border border-blue-500/30">
                        <Zap className="w-3 h-3" />
                        <span>ATS-optimized</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isAuthenticated && !loadingSubscription && (
              <div className="relative text-center mb-8 z-10">
                <button className="inline-flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-200 font-semibold text-sm bg-gradient-to-r from-neon-purple-500 to-neon-blue-600 text-white shadow-md hover:shadow-neon-purple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-cyan-500 max-w-[300px] mx-auto justify-center dark:shadow-neon-purple">
                  <span>
                    {userSubscription
                      ? `Optimizations Left: ${userSubscription.optimizationsTotal - userSubscription.optimizationsUsed}`
                      : 'No Active Plan'}
                  </span>
                </button>
              </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">
              <InputWizard
                extractionResult={extractionResult}
                setExtractionResult={setExtractionResult}
                scoringMode={scoringMode}
                setScoringMode={setScoringMode}
                autoScoreOnUpload={autoScoreOnUpload}
                setAutoScoreOnUpload={setAutoScoreOnUpload}
                jobDescription={jobDescription}
                setJobDescription={setJobDescription}
                targetRole={targetRole}
                setTargetRole={setTargetRole}
                userType={userType}
                setUserType={setUserType}
                handleOptimize={handleOptimize}
                isAuthenticated={isAuthenticated}
                onShowAuth={onShowAuth}
                user={user}
                onShowProfile={onShowProfile}
              />
            </div>
          </>
        ) : (
          <div className="max-w-7xl mx-auto">
            {jobContext?.fromJobApplication && jobContext.jobId && (
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 shadow-lg mb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-bold text-white">Resume Optimized Successfully!</h3>
                        <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                          READY
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">
                        Your resume has been optimized for <span className="font-semibold text-emerald-400">{jobContext.roleTitle}</span> at <span className="font-semibold text-emerald-400">{jobContext.companyName}</span>
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>ATS-optimized</span>
                        <span>•</span>
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Keyword-matched</span>
                        <span>•</span>
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Ready to download</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExternalApply(optimizedResume)}
                    className="group flex-shrink-0 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 flex items-center space-x-3"
                  >
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span>Apply Now</span>
                  </button>
                </div>
                <div className="mt-4 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Make sure to download your optimized resume before applying for future reference</span>
                  </p>
                </div>
              </div>
            )}

            <div className="text-center flex flex-col items-center gap-4 mb-6">
              <button
                onClick={handleStartNewResume}
                className="inline-flex items-center space-x-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 hover:border-emerald-500/30 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Create New Resume</span>
              </button>
            </div>

            {optimizedResume && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Export Settings */}
                <div className="space-y-6">
                  <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-slate-700/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 p-4 border-b border-slate-700/50">
                      <h2 className="text-xl font-semibold text-white flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-emerald-400" />
                        Export Resume
                      </h2>
                    </div>
                    <div className="p-6 space-y-6">
                      <ExportButtons
                        resumeData={optimizedResume}
                        userType={userType}
                        onShowProfile={onShowProfile}
                        walletRefreshKey={walletRefreshKey}
                      />
                      <ResumeExportSettings
                        resumeData={optimizedResume}
                        userType={userType}
                        onExport={handleExportFile}
                        showInlinePreview={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Panel - Sticky Resume Preview */}
                <div className="lg:sticky lg:top-6 lg:self-start">
                  <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-slate-700/50 overflow-hidden">
                    <ResumePreviewControls
                      zoom={previewZoom}
                      onZoomIn={handleZoomIn}
                      onZoomOut={handleZoomOut}
                      onFitWidth={handleFitWidth}
                      onFullScreen={handleFullScreen}
                      minZoom={MIN_ZOOM}
                      maxZoom={MAX_ZOOM}
                    />
                    <div className="bg-slate-800/20 p-4 flex items-center justify-center" style={{ minHeight: '600px' }}>
                      <div 
                        className="transform-gpu"
                        style={{ 
                          transform: `scale(${previewZoom})`, 
                          transformOrigin: 'top center'
                        }}
                      >
                        <ResumePreview
                          resumeData={optimizedResume}
                          userType={userType}
                          exportOptions={exportOptions}
                          showControls={false}
                          defaultZoom={0.98}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showProjectMismatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Project Mismatch Detected</h2>
                <p className="text-gray-600">
                  Your current projects don't align well with the job description. Would you like to add a relevant project to improve your resume score?
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">{initialResumeScore?.totalScore}/100</div>
                  <div className="text-sm text-red-700">Current Resume Score</div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => handleProjectMismatchResponse(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
                  Yes, Add Project
                </button>
                <button onClick={() => handleProjectMismatchResponse(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors">
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProjectOptions && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Project Addition Method</h2>
                <p className="text-gray-600">How would you like to add a relevant project to your resume?</p>
              </div>
              <div className="space-x-3">
                <button onClick={() => handleProjectOptionSelect('manual')} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Manual Add - I'll provide project details</span>
                </button>
                <button onClick={() => handleProjectOptionSelect('ai')} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>AI-Suggested - Generate automatically</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManualProjectAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Add Project Manually</h2>
                <p className="text-gray-600">Provide project details and AI will generate a professional description</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                  <input
                    type="text"
                    value={manualProject.title}
                    onChange={(e) => setManualProject(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., E-commerce Website"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input
                      type="month"
                      value={manualProject.startDate}
                      onChange={(e) => setManualProject(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <input
                      type="month"
                      value={manualProject.endDate}
                      onChange={(e) => setManualProject(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tech Stack *</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTechStack}
                      onChange={(e) => setNewTechStack(e.target.value)}
                      placeholder="e.g., React, Node.js"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      onKeyDown={(e) => e.key === 'Enter' && addTechToStack()}
                    />
                    <button
                      onClick={addTechToStack}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {manualProject.techStack.map((tech, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        {tech}
                        <button onClick={() => removeTechFromStack(tech)} className="ml-2 text-green-600 hover:text-green-800">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">One-liner Description (Optional)</label>
                  <input
                    type="text"
                    value={manualProject.oneLiner}
                    onChange={(e) => setManualProject(prev => ({ ...prev, oneLiner: e.target.value }))}
                    placeholder="Brief description of the project"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleManualProjectSubmit}
                  disabled={!manualProject.title || manualProject.techStack.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Generate & Add Project
                </button>
                <button onClick={() => setShowManualProjectAdd(false)} className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProjectEnhancement
        isOpen={showProjectEnhancement}
        onClose={() => setShowProjectEnhancement(false)}
        currentResume={parsedResumeData || optimizedResume || { name: '', phone: '', email: '', linkedin: '', github: '', education: [], workExperience: [], projects: [], skills: [], certifications: [] }}
        jobDescription={jobDescription}
        onProjectsAdded={handleProjectsUpdated}
      />

      <ProjectAnalysisModal
        isOpen={showProjectAnalysis}
        onClose={() => setShowProjectAnalysis(false)}
        resumeData={parsedResumeData || optimizedResume || { name: '', phone: '', email: '', linkedin: '', github: '', education: [], workExperience: [], projects: [], skills: [], certifications: [] }}
        jobDescription={jobDescription}
        targetRole={targetRole}
        onProjectsUpdated={handleProjectsUpdated}
      />

      <MissingSectionsModal
        isOpen={showMissingSectionsModal}
        onClose={() => {
          setShowMissingSectionsModal(false);
          setMissingSections([]);
          setPendingResumeData(null);
          setIsOptimizing(false);
        }}
        missingSections={missingSections}
        onSectionsProvided={handleMissingSectionsProvided}
      />

      <FullScreenPreviewModal
        isOpen={showFullScreenPreview}
        onClose={() => setShowFullScreenPreview(false)}
        resumeData={optimizedResume || { name: '', phone: '', email: '', linkedin: '', github: '', education: [], workExperience: [], projects: [], skills: [], certifications: [] }}
        userType={userType}
        exportOptions={exportOptions}
      />
    </div>
  );
};

export default ResumeOptimizer;

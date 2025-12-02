import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  Github,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight,
  FileText,
  Lightbulb,
  Target,
  RefreshCw
} from 'lucide-react';
import { ResumeData } from '../types/resume';
import { ProjectSuitabilityResult } from '../types/analysis';
import { analyzeProjectSuitability, fetchGitHubProjects, generateProjectBullets } from '../services/projectAnalysisService';
import { advancedProjectAnalyzer } from '../services/advancedProjectAnalyzer';

interface ProjectAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  jobDescription: string;
  targetRole: string;
  onProjectsUpdated: (updatedResume: ResumeData) => void;
}

export const ProjectAnalysisModal: React.FC<ProjectAnalysisModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  jobDescription,
  targetRole,
  onProjectsUpdated
}) => {
  const [analysisResult, setAnalysisResult] = useState<ProjectSuitabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedReplacements, setSelectedReplacements] = useState<{[key: string]: boolean}>({});
  const [selectedSuggestions, setSelectedSuggestions] = useState<{[key: string]: boolean}>({});
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualProject, setManualProject] = useState({
    title: '',
    techStack: [] as string[],
    newTech: '',
    description: ''
  });
  const [generatingBullets, setGeneratingBullets] = useState(false);
  const [manualBullets, setManualBullets] = useState<string[]>([]);
  const [step, setStep] = useState<'analysis' | 'selection' | 'preview'>('analysis');
  const [updatedResume, setUpdatedResume] = useState<ResumeData | null>(null);
  const [useAdvancedAnalysis, setUseAdvancedAnalysis] = useState(false);

  useEffect(() => {
    if (isOpen) {
      analyzeProjects();
    }
  }, [isOpen, resumeData, jobDescription, targetRole, useAdvancedAnalysis]); // Added useAdvancedAnalysis to dependencies

  const analyzeProjects = async () => {
    setLoading(true);
    try {
      if (useAdvancedAnalysis) {
        // Use the new advanced analyzer
        const advancedResult = await advancedProjectAnalyzer.analyzeAndReplaceProjects(
          resumeData,
          targetRole,
          jobDescription,
          setLoading
        );

        // Convert to the expected format
        const convertedResult: ProjectSuitabilityResult = {
          projectAnalysis: [
            ...advancedResult.projectsToReplace.map(p => ({
              title: p.title,
              suitable: p.score >= 80,
              reason: p.score < 80 ? p.reason : undefined,
              replacementSuggestion: undefined // Advanced analyzer doesn't directly provide replacement suggestions in this format
            })),
            ...(resumeData.projects?.filter(project =>
              !advancedResult.projectsToReplace.some(p => p.title === project.title)
            ).map(project => ({
              title: project.title,
              suitable: true,
              reason: undefined,
              replacementSuggestion: undefined
            })) || [])
          ],
          summary: {
            totalProjects: resumeData.projects?.length || 0,
            suitableProjects: (resumeData.projects?.length || 0) - advancedResult.projectsToReplace.length,
            unsuitableProjects: advancedResult.projectsToReplace.length
          },
          suggestedProjects: advancedResult.replacementSuggestions.map(s => ({
            title: s.title,
            githubUrl: s.githubUrl,
            bulletPoints: s.bullets
          }))
        };

        setAnalysisResult(convertedResult);
      } else {
        // Use the existing analyzer
        const result = await analyzeProjectSuitability(resumeData, jobDescription, targetRole);
        setAnalysisResult(result);
      }

      // Initialize selection state
      const initialReplacements: {[key: string]: boolean} = {};
      if (analysisResult) { // Use the analysisResult from state after it's set
        analysisResult.projectAnalysis.forEach(project => {
          if (!project.suitable && project.replacementSuggestion) {
            initialReplacements[project.title] = false;
          }
        });
      }
      setSelectedReplacements(initialReplacements);

      const initialSuggestions: {[key: string]: boolean} = {};
      if (analysisResult) { // Use the analysisResult from state after it's set
        analysisResult.suggestedProjects.forEach(project => {
          initialSuggestions[project.title] = false;
        });
      }
      setSelectedSuggestions(initialSuggestions);

      setStep('analysis');
    } catch (error) {
      console.error('Error analyzing projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTech = () => {
    if (manualProject.newTech.trim() && !manualProject.techStack.includes(manualProject.newTech.trim())) {
      setManualProject({
        ...manualProject,
        techStack: [...manualProject.techStack, manualProject.newTech.trim()],
        newTech: ''
      });
    }
  };

  const handleRemoveTech = (tech: string) => {
    setManualProject({
      ...manualProject,
      techStack: manualProject.techStack.filter(t => t !== tech)
    });
  };

  const handleGenerateManualBullets = async () => {
    if (!manualProject.title || manualProject.techStack.length === 0) {
      alert('Please provide a project title and at least one technology');
      return;
    }

    setGeneratingBullets(true);
    try {
      const bullets = await generateProjectBullets(
        manualProject.title,
        manualProject.techStack,
        jobDescription,
        targetRole
      );
      setManualBullets(bullets);
    } catch (error) {
      console.error('Error generating bullets:', error);
      alert('Failed to generate project description. Please try again.');
    } finally {
      setGeneratingBullets(false);
    }
  };

  const handleToggleReplacement = (projectTitle: string) => {
    setSelectedReplacements({
      ...selectedReplacements,
      [projectTitle]: !selectedReplacements[projectTitle]
    });
  };

  const handleToggleSuggestion = (projectTitle: string) => {
    setSelectedSuggestions({
      ...selectedSuggestions,
      [projectTitle]: !selectedSuggestions[projectTitle]
    });
  };

  const handleContinue = () => {
    setStep('selection');
  };

  // New handleSkip function
  const handleSkip = () => {
    setUpdatedResume(resumeData); // Set updatedResume to original resumeData
    setStep('preview'); // Transition to preview step
  };

  const handleAddManualProject = () => {
    if (manualBullets.length === 0) {
      alert('Please generate bullet points first');
      return;
    }

    // Create updated resume with manual project
    const newProject = {
      title: manualProject.title,
      bullets: manualBullets
    };

    // Create updated resume
    createUpdatedResume([newProject]);

    // Reset form
    setManualProject({
      title: '',
      techStack: [],
      newTech: '',
      description: ''
    });
    setManualBullets([]);
    setShowManualForm(false);
    setStep('preview');
  };

  const handleApplyChanges = () => {
    if (!analysisResult) return;

    const newProjects = [];

    // Add replacement projects
    for (const project of analysisResult.projectAnalysis) {
      if (!project.suitable && selectedReplacements[project.title] && project.replacementSuggestion) {
        newProjects.push({
          title: project.replacementSuggestion.title,
          bullets: project.replacementSuggestion.bulletPoints,
          githubUrl: project.replacementSuggestion.githubUrl
        });
      }
    }

    // Add suggested projects
    for (const project of analysisResult.suggestedProjects) {
      if (selectedSuggestions[project.title]) {
        newProjects.push({
          title: project.title,
          bullets: project.bulletPoints,
          githubUrl: project.githubUrl
        });
      }
    }

    // Create updated resume
    createUpdatedResume(newProjects);
    setStep('preview');
  };

  const createUpdatedResume = (newProjects: any[]) => {
    if (!analysisResult) return;

    // Step 1: Keep only suitable projects from original resume (score 80+)
    const suitableProjects = resumeData.projects?.filter(project =>
      analysisResult.projectAnalysis.some(analysis =>
        analysis.title === project.title && analysis.suitable
      )
    ) || [];

    // Step 2: REMOVE existing low-scoring projects and REPLACE with new projects
    const finalProjects = [...suitableProjects]; // Start with only good existing projects

    // Step 3: Add new projects (replacements + suggestions) up to 3 total
    for (const newProject of newProjects) {
      if (finalProjects.length < 3) {
        finalProjects.push(newProject);
      } else {
        break; // Stop once we reach 3 projects maximum
      }
    }

    // Step 4: Create updated resume with replaced projects
    const updated = {
      ...resumeData,
      projects: finalProjects
    };

    setUpdatedResume(updated);

    // Log the replacement process
    const removedCount = (resumeData.projects?.length || 0) - suitableProjects.length;
    const addedCount = finalProjects.length - suitableProjects.length;
    console.log(`Project replacement: ${removedCount} low-scoring projects removed, ${addedCount} new projects added, ${suitableProjects.length} good projects kept. Total: ${finalProjects.length}/3`);
  };

  const handleFinish = () => {
    if (updatedResume) {
      onProjectsUpdated(updatedResume);
    }
    onClose();
  };

  const countSelectedProjects = () => {
    if (!analysisResult) return 0;

    let count = 0;

    // Count selected replacements
    for (const project of analysisResult.projectAnalysis) {
      if (!project.suitable && selectedReplacements[project.title]) {
        count++;
      }
    }

    // Count selected suggestions
    for (const project of analysisResult.suggestedProjects) {
      if (selectedSuggestions[project.title]) {
        count++;
      }
    }

    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-16 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div
        className="bg-slate-900 rounded-none shadow-2xl w-full h-screen flex flex-col"
        style={{ maxHeight: '100vh' }}
      >

        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 p-3 sm:p-6 border-b border-slate-700">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors rounded-full hover:bg-slate-700/50 min-w-[44px] min-h-[44px]"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-100 mb-2 px-8">
              Project Analysis & Recommendations
            </h1>
            <p className="text-sm sm:text-base text-slate-400 px-4">
              Analyze your projects against job requirements and get personalized recommendations
            </p>

            {/* Analysis Mode Toggle */}
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 px-4">
              <button
                onClick={() => setUseAdvancedAnalysis(false)}
                className={`w-full sm:w-auto px-3 py-2 rounded-lg font-medium transition-colors text-sm min-h-[44px] ${
                  !useAdvancedAnalysis
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                Standard Analysis
              </button>
              <button
                onClick={() => setUseAdvancedAnalysis(true)}
                className={`w-full sm:w-auto px-3 py-2 rounded-lg font-medium transition-colors text-sm min-h-[44px] ${
                  useAdvancedAnalysis
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                Advanced Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-6 flex-shrink-0 bg-slate-900">
          <div className="flex flex-row items-center justify-around mb-4 sm:mb-8 gap-4">
            <div className="flex items-center w-auto">
              <div className="w-auto flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'analysis' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                <Target className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-slate-100 hidden sm:block">Analysis</div>
                <div className="text-xs text-slate-500 hidden sm:block">Review project fit</div>
              </div>
              </div>
            </div>
            <div className="w-full sm:w-16 h-1 bg-slate-700 hidden sm:block">
              <div className={`h-1 bg-emerald-500 transition-all ${
                step === 'analysis' ? 'w-0' : step === 'selection' ? 'w-1/2' : 'w-full'
              }`}></div>
            </div>
            <div className="flex items-center w-auto">
              <div className="w-auto flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'selection' ? 'bg-emerald-500 text-white' : step === 'preview' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
              }`}>
                <Plus className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-slate-100 hidden sm:block">Selection</div>
                <div className="text-xs text-slate-500 hidden sm:block">Choose projects</div>
              </div>
              </div>
            </div>
            <div className="w-full sm:w-16 h-1 bg-slate-700 hidden sm:block">
              <div className={`h-1 bg-emerald-500 transition-all ${
                step === 'preview' ? 'w-full' : 'w-0'
              }`}></div>
            </div>
            <div className="flex items-center w-auto">
              <div className="w-auto flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'preview' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-slate-100 hidden sm:block">Preview</div>
                <div className="text-xs text-slate-500 hidden sm:block">Review changes</div>
              </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-slate-900 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-emerald-400 mx-auto mb-4" />
              <p className="text-lg sm:text-xl font-semibold text-slate-100 mb-2">Analyzing Your Projects</p>
              <p className="text-sm sm:text-base text-slate-400 px-4">We're comparing your projects with the job requirements...</p>
            </div>
          ) : step === 'analysis' && analysisResult ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Project Scoring Results */}
              <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-3 sm:mb-4 flex items-center">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-400" />
                  Project Analysis Results
                </h2>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border border-slate-700">
                    <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-1 sm:mb-2">{analysisResult.summary.totalProjects}</div>
                    <div className="text-xs sm:text-sm font-medium text-slate-400">Total Projects</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border border-slate-700">
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-1 sm:mb-2">{analysisResult.summary.suitableProjects}</div>
                    <div className="text-xs sm:text-sm font-medium text-slate-400">Well Aligned (80+)</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border border-slate-700">
                    <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1 sm:mb-2">{analysisResult.summary.unsuitableProjects}</div>
                    <div className="text-xs sm:text-sm font-medium text-slate-400">Need Replacement (&lt;80)</div>
                  </div>
                </div>

                {/* Individual Project Analysis */}
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-2 sm:mb-3">Project-by-Project Analysis:</h3>

                  {analysisResult.projectAnalysis.map((project, index) => (
                    <div key={index} className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-5 transition-all ${
                      project.suitable
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-red-500/50 bg-red-500/10'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                          <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${
                            project.suitable
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {project.suitable ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-lg font-bold text-slate-100 mb-1 break-words">"{project.title}"</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                              <span className={`text-sm font-medium ${
                                project.suitable ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                Score: {project.suitable ? '80+' : '<80'} / 100
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                project.suitable
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                {project.suitable ? <><CheckCircle className="w-3 h-3" /> KEEP</> : <><XCircle className="w-3 h-3" /> REPLACE</>}
                              </span>
                            </div>
                            {!project.suitable && project.reason && (
                              <p className="text-amber-400/80 text-xs sm:text-sm mt-2 break-words">
                                <span className="font-medium">Reason:</span> {project.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`flex-shrink-0 ${
                          project.suitable ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {project.suitable ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Message */}
                {analysisResult.summary.unsuitableProjects > 0 && (
                  <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-lg sm:rounded-xl p-3 sm:p-5">
                    <div className="flex items-start space-x-3">
                      <div className="bg-amber-500/20 p-2 rounded-full flex-shrink-0">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-300 text-sm sm:text-lg">Action Required</h4>
                        <p className="text-amber-400/80 text-xs sm:text-sm break-words">
                          We found **{analysisResult.summary.unsuitableProjects}** project{analysisResult.summary.unsuitableProjects > 1 ? 's' : ''} that don't align well with your target role.
                          You can replace {analysisResult.summary.unsuitableProjects === 1 ? 'it' : 'them'} with more relevant projects to improve your resume score.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-3 sm:gap-4">
                {/* New "Skip for now" button */}
                {analysisResult.summary.unsuitableProjects === 0 && (
                  <button
                    onClick={handleSkip}
                    className="w-full sm:w-auto px-4 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm min-h-[44px] flex items-center justify-center space-x-2"
                  >
                    <span>Skip for now</span>
                  </button>
                )}

                {/* "Continue" button - Modified text */}
                <button
                  onClick={handleContinue}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105 min-h-[44px]"
                >
                  <span className="text-sm sm:text-base">
                    {analysisResult.summary.unsuitableProjects > 0
                      ? `Replace ${analysisResult.summary.unsuitableProjects} Project${analysisResult.summary.unsuitableProjects > 1 ? 's' : ''}`
                      : 'Add More Projects'
                    }
                  </span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          ) : step === 'selection' && analysisResult ? (
            <div className="space-y-6">
              {/* Simple instruction */}
              <div className="text-center text-slate-400 text-sm">
                Select the projects you want to add to your resume
              </div>

              {/* Replacement Projects - Side by Side Layout */}
              {analysisResult.projectAnalysis.some(p => !p.suitable && p.replacementSuggestion) && (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-slate-100 flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 text-amber-400" />
                    Replace These Projects
                  </h2>

                  {analysisResult.projectAnalysis.filter(p => !p.suitable && p.replacementSuggestion).map((project, index) => (
                    <label
                      key={index}
                      className={`block cursor-pointer rounded-xl border-2 transition-all ${
                        selectedReplacements[project.title]
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="p-4">
                        {/* Checkbox row */}
                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            checked={selectedReplacements[project.title] || false}
                            onChange={() => handleToggleReplacement(project.title)}
                            className="w-5 h-5 rounded border-slate-500 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                          />
                          <span className="ml-3 text-sm text-slate-300">Use this replacement</span>
                        </div>

                        {/* Side by side comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Old Project */}
                          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                            <div className="text-xs text-red-400 mb-1 font-medium">REMOVE</div>
                            <div className="text-slate-100 text-sm font-medium truncate">{project.title}</div>
                          </div>

                          {/* New Project */}
                          {project.replacementSuggestion && (
                            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
                              <div className="text-xs text-emerald-400 mb-1 font-medium">ADD</div>
                              <div className="text-slate-100 text-sm font-medium truncate">{project.replacementSuggestion.title}</div>
                              <a
                                href={project.replacementSuggestion.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Github className="w-3 h-3 mr-1" />
                                View on GitHub
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Suggested Projects - Simple Checklist */}
              {analysisResult.suggestedProjects.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-slate-100 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-emerald-400" />
                    Add New Projects
                  </h2>

                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 divide-y divide-slate-700">
                    {analysisResult.suggestedProjects.map((project, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 cursor-pointer transition-colors ${
                          selectedSuggestions[project.title] ? 'bg-emerald-500/10' : 'hover:bg-slate-700/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuggestions[project.title] || false}
                          onChange={() => handleToggleSuggestion(project.title)}
                          className="w-5 h-5 rounded border-slate-500 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 flex-shrink-0"
                        />
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="text-slate-100 text-sm font-medium">{project.title}</div>
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Github className="w-3 h-3 mr-1" />
                            {project.githubUrl.replace('https://github.com/', '')}
                          </a>
                        </div>
                        {selectedSuggestions[project.title] && (
                          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Project Addition */}
              <div className="bg-purple-500/10 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-purple-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-100 flex items-center">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-400" />
                    Add Project Manually
                  </h2>
                  <button
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2 min-h-[44px]"
                  >
                    {showManualForm ? <X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
                    <span>{showManualForm ? 'Cancel' : 'Add Project'}</span>
                  </button>
                </div>

                {showManualForm && (
                  <div className="bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-700">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                          Project Title *
                        </label>
                        <input
                          type="text"
                          value={manualProject.title}
                          onChange={(e) => setManualProject({...manualProject, title: e.target.value})}
                          placeholder="e.g., E-commerce Website"
                          className="w-full px-3 py-3 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm min-h-[44px] bg-slate-700 text-slate-100 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                          Tech Stack *
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                          <input
                            type="text"
                            value={manualProject.newTech}
                            onChange={(e) => setManualProject({...manualProject, newTech: e.target.value})}
                            placeholder="Add technology (e.g., React, Node.js)"
                            className="w-full sm:flex-1 px-3 py-3 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm min-h-[44px] bg-slate-700 text-slate-100 placeholder-slate-400"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTech()}
                          />
                          <button
                            onClick={handleAddTech}
                            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm min-h-[44px]"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                          {manualProject.techStack.map((tech, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            >
                              {tech}
                              <button
                                onClick={() => handleRemoveTech(tech)}
                                className="ml-1 sm:ml-2 text-purple-400 hover:text-purple-200 min-w-[20px] min-h-[20px] flex items-center justify-center"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                          Brief Description (Optional)
                        </label>
                        <textarea
                          value={manualProject.description}
                          onChange={(e) => setManualProject({...manualProject, description: e.target.value})}
                          placeholder="Brief description of what the project does"
                          className="w-full px-3 py-3 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-20 resize-none text-sm bg-slate-700 text-slate-100 placeholder-slate-400"
                        />
                      </div>

                      {manualBullets.length > 0 ? (
                        <div className="bg-emerald-500/10 p-3 sm:p-4 rounded-lg border border-emerald-500/30">
                          <h4 className="font-medium text-emerald-300 mb-2 flex items-center text-sm">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Generated Bullet Points
                          </h4>
                          <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                            {manualBullets.map((bullet, i) => (
                              <li key={i} className="flex items-start break-words">
                                <span className="text-emerald-400 mr-2">•</span>
                                <span className="break-words">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateManualBullets}
                          disabled={!manualProject.title || manualProject.techStack.length === 0 || generatingBullets}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:text-slate-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm min-h-[44px]"
                        >
                          {generatingBullets ? (
                            <>
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              <span>Generating Bullet Points...</span>
                            </>
                          ) : (
                            <>
                              <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Generate Bullet Points</span>
                            </>
                          )}
                        </button>
                      )}

                      {manualBullets.length > 0 && (
                        <button
                          onClick={handleAddManualProject}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm min-h-[44px]"
                        >
                          Add Project to Resume
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
                  {countSelectedProjects()} project{countSelectedProjects() !== 1 ? 's' : ''} selected
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setStep('analysis')}
                    className="w-full sm:w-auto px-4 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm min-h-[44px]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleApplyChanges}
                    disabled={countSelectedProjects() === 0}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-600 disabled:text-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm min-h-[44px]"
                  >
                    <span>Apply Changes & Preview</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : step === 'preview' && updatedResume ? (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-100">Projects Updated Successfully</h2>
                <p className="text-slate-400 text-sm mt-1">{updatedResume.projects?.length || 0} projects will be added to your resume</p>
              </div>

              {/* Projects List - Clean Card Style */}
              <div className="space-y-3">
                {updatedResume.projects?.map((project, index) => (
                  <div key={index} className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-100 text-sm">{project.title}</h3>
                      <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">#{index + 1}</span>
                    </div>
                    
                    {/* Bullet points - compact */}
                    <ul className="space-y-1 text-xs text-slate-400 mb-3">
                      {project.bullets.slice(0, 2).map((bullet, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-slate-500 mr-2">•</span>
                          <span className="line-clamp-1">{bullet}</span>
                        </li>
                      ))}
                      {project.bullets.length > 2 && (
                        <li className="text-slate-500 text-xs">+{project.bullets.length - 2} more points</li>
                      )}
                    </ul>

                    {/* GitHub link */}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-cyan-400 hover:text-cyan-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Github className="w-3 h-3 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{(project.githubUrl as string).replace('https://github.com/', '')}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Info Note - Minimal */}
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/30 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>GitHub links are for reference only and won't appear in the exported resume.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setStep('selection')}
                  className="flex-1 sm:flex-none px-4 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm"
                >
                  Back to Selection
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  Confirm & Apply
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 px-4">
              <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mx-auto mb-4" />
              <p className="text-lg sm:text-xl font-semibold text-slate-100 mb-2">No Analysis Available</p>
              <p className="text-sm sm:text-base text-slate-400 mb-4 break-words">There was a problem analyzing your projects. Please try again.</p>
              <button
                onClick={analyzeProjects}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm min-h-[44px]"
              >
                Retry Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { ResumeData } from '../types/resume';
import { ExportOptions } from '../types/export';

interface ATSCompatibilityCheckerProps {
  resumeData: ResumeData;
  exportOptions: ExportOptions;
}

interface ATSCategory {
  name: string;
  score: number;
  maxScore: number;
  issues: string[];
  fixes: string[];
  status: 'excellent' | 'good' | 'warning' | 'error';
}

export const ATSCompatibilityChecker: React.FC<ATSCompatibilityCheckerProps> = ({
  resumeData,
  exportOptions
}) => {
  const atsAnalysis = useMemo(() => {
    const categories: ATSCategory[] = [];

    const fontAndText = analyzeFontAndText(exportOptions);
    categories.push(fontAndText);

    const layoutAndMargins = analyzeLayoutAndMargins(exportOptions);
    categories.push(layoutAndMargins);

    const headingsAndSections = analyzeHeadingsAndSections(resumeData);
    categories.push(headingsAndSections);

    const contentFormatting = analyzeContentFormatting(resumeData);
    categories.push(contentFormatting);

    const keywordsAndParsing = analyzeKeywordsAndParsing(resumeData);
    categories.push(keywordsAndParsing);

    const fileFormat = analyzeFileFormat();
    categories.push(fileFormat);

    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    const totalMaxScore = categories.reduce((sum, cat) => sum + cat.maxScore, 0);
    const overallPercentage = Math.round((totalScore / totalMaxScore) * 100);

    return {
      categories,
      totalScore,
      totalMaxScore,
      overallPercentage
    };
  }, [resumeData, exportOptions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
          ATS Compatibility Score
        </h3>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Score</span>
            <span className={`text-3xl font-bold ${getScoreColor(atsAnalysis.overallPercentage)}`}>
              {atsAnalysis.overallPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-dark-300">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${getProgressBarColor(atsAnalysis.overallPercentage)}`}
              style={{ width: `${atsAnalysis.overallPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {atsAnalysis.totalScore} out of {atsAnalysis.totalMaxScore} points
          </p>
        </div>

        <div className="space-y-4">
          {atsAnalysis.categories.map((category, index) => (
            <div key={index} className="border border-gray-200 dark:border-dark-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(category.status)}
                  <span className="font-semibold text-gray-900 dark:text-white">{category.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.score}/{category.maxScore}
                </span>
              </div>

              {category.issues.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Issues Found:</p>
                  <ul className="space-y-1">
                    {category.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                        <span className="mr-1">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {category.fixes.length > 0 && (
                <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">Recommended Fixes:</p>
                  <ul className="space-y-1">
                    {category.fixes.map((fix, i) => (
                      <li key={i} className="text-xs text-blue-800 dark:text-blue-300 flex items-start">
                        <span className="mr-1">→</span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function analyzeFontAndText(options: ExportOptions): ATSCategory {
  const issues: string[] = [];
  const fixes: string[] = [];
  let score = 10;

  const atsFriendlyFonts = ['Calibri', 'Arial', 'Times New Roman', 'Verdana'];
  if (!atsFriendlyFonts.includes(options.fontFamily)) {
    issues.push('Font family may not be ATS-friendly');
    fixes.push('Use Calibri, Arial, Times New Roman, or Verdana');
    score -= 1;
  }

  if (options.bodyTextSize < 10) {
    issues.push(`Body text size is ${options.bodyTextSize}pt (too small)`);
    fixes.push('Increase body text to 11pt for better readability');
    score -= 1;
  }

  if (options.sectionHeaderSize < 12) {
    issues.push(`Section headers are ${options.sectionHeaderSize}pt (too small)`);
    fixes.push('Increase section headers to 13-14pt');
    score -= 1;
  }

  const status = score >= 9 ? 'excellent' : score >= 7 ? 'good' : score >= 5 ? 'warning' : 'error';

  return {
    name: 'Font & Text',
    score,
    maxScore: 10,
    issues,
    fixes,
    status
  };
}

function analyzeLayoutAndMargins(options: ExportOptions): ATSCategory {
  const issues: string[] = [];
  const fixes: string[] = [];
  let score = 10;

  if (options.layoutType !== 'ats-optimized' && options.layoutType !== 'standard') {
    issues.push('Layout may not be ATS-friendly');
    fixes.push('Use "ATS Optimized" or "Standard" layout');
    score -= 2;
  }

  const status = score >= 9 ? 'excellent' : score >= 7 ? 'good' : score >= 5 ? 'warning' : 'error';

  return {
    name: 'Layout & Margins',
    score,
    maxScore: 10,
    issues,
    fixes,
    status
  };
}

function analyzeHeadingsAndSections(resumeData: ResumeData): ATSCategory {
  const issues: string[] = [];
  const fixes: string[] = [];
  let score = 10;

  if (!resumeData.certifications || resumeData.certifications.length === 0) {
    issues.push('Missing Certifications section');
    fixes.push('Add a Certifications section, even if empty (e.g., "Available upon request")');
    score -= 1;
  }

  if (!resumeData.name || !resumeData.email || !resumeData.phone) {
    issues.push('Missing essential contact information');
    fixes.push('Ensure name, email, and phone are filled');
    score -= 2;
  }

  const status = score >= 9 ? 'excellent' : score >= 7 ? 'good' : score >= 5 ? 'warning' : 'error';

  return {
    name: 'Headings & Sections',
    score,
    maxScore: 10,
    issues,
    fixes,
    status
  };
}

function analyzeContentFormatting(resumeData: ResumeData): ATSCategory {
  const issues: string[] = [];
  const fixes: string[] = [];
  let score = 10;

  let longBulletCount = 0;

  resumeData.workExperience?.forEach(job => {
    job.bullets?.forEach(bullet => {
      if (typeof bullet === 'string' && bullet.length > 120) {
        longBulletCount++;
      }
    });
  });

  resumeData.projects?.forEach(project => {
    project.bullets?.forEach(bullet => {
      if (typeof bullet === 'string' && bullet.length > 120) {
        longBulletCount++;
      }
    });
  });

  if (longBulletCount > 0) {
    issues.push(`${longBulletCount} bullet point(s) exceed 120 characters`);
    fixes.push('Keep all bullet points under 120 characters to prevent ATS truncation');
    score -= Math.min(2, longBulletCount);
  }

  const status = score >= 9 ? 'excellent' : score >= 7 ? 'good' : score >= 5 ? 'warning' : 'error';

  return {
    name: 'Content Formatting',
    score,
    maxScore: 10,
    issues,
    fixes,
    status
  };
}

function analyzeKeywordsAndParsing(resumeData: ResumeData): ATSCategory {
  const issues: string[] = [];
  const fixes: string[] = [];
  let score = 20;

  const allText = JSON.stringify(resumeData).toLowerCase();

  const cloudKeywords = ['aws', 'azure', 'gcp', 'cloud'];
  const hasCloudKeywords = cloudKeywords.some(keyword => allText.includes(keyword));
  if (!hasCloudKeywords) {
    issues.push('Missing cloud platform keywords (AWS, Azure, GCP)');
    fixes.push('Add cloud technology keywords to projects or experience');
    score -= 3;
  }

  const methodologyKeywords = ['agile', 'scrum', 'sdlc', 'ci/cd'];
  const hasMethodology = methodologyKeywords.some(keyword => allText.includes(keyword));
  if (!hasMethodology) {
    issues.push('Missing methodology keywords (Agile, SDLC, CI/CD)');
    fixes.push('Include development methodologies in your experience');
    score -= 3;
  }

  const apiKeywords = ['api', 'rest', 'graphql'];
  const hasApiKeywords = apiKeywords.some(keyword => allText.includes(keyword));
  if (!hasApiKeywords) {
    issues.push('Missing API-related keywords');
    fixes.push('Mention REST API, GraphQL, or API integration experience');
    score -= 2;
  }

  const status = score >= 17 ? 'excellent' : score >= 13 ? 'good' : score >= 10 ? 'warning' : 'error';

  return {
    name: 'Keywords & Parsing',
    score,
    maxScore: 20,
    issues,
    fixes,
    status
  };
}

function analyzeFileFormat(): ATSCategory {
  const issues: string[] = [];
  const fixes: string[] = [];
  const score = 10;

  const status = 'excellent';

  return {
    name: 'File Format & Compatibility',
    score,
    maxScore: 10,
    issues,
    fixes,
    status
  };
}

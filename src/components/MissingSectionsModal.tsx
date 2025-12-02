import React, { useState } from 'react';
import {
  X,
  Plus,
  Briefcase,
  Code,
  Award,
  AlertCircle,
  CheckCircle,
  Calendar,
  Building,
  Phone,
  Mail,
  Link,
  Github,
  ArrowLeft,
  ArrowRight,
  Target,
  GraduationCap
} from 'lucide-react';

interface WorkExperience {
  role: string;
  company: string;
  year: string;
  bullets: string[];
}

interface Project {
  title: string;
  bullets: string[];
}

interface Skill {
  category: string;
  count: number;
  list: string[];
}

interface Education {
  degree: string;
  school: string;
  year: string;
  cgpa?: string;
  location?: string;
}

interface ContactDetails {
  phone: string;
  email: string;
  linkedin: string;
  github: string;
}

interface MissingSectionsData {
  workExperience?: WorkExperience[];
  projects?: Project[];
  skills?: Skill[];
  education?: Education[];
  certifications?: string[];
  contactDetails?: ContactDetails;
}

interface MissingSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingSections: string[];
  onSectionsProvided: (data: MissingSectionsData) => void;
}

export const MissingSectionsModal: React.FC<MissingSectionsModalProps> = ({
  isOpen,
  onClose,
  missingSections,
  onSectionsProvided
}) => {
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([
    { role: '', company: '', year: '', bullets: [''] }
  ]);
  const [projects, setProjects] = useState<Project[]>([
    { title: '', bullets: [''] }
  ]);
  const [skills, setSkills] = useState<Skill[]>([
    { category: '', count: 0, list: [] }
  ]);
  const [skillInputs, setSkillInputs] = useState<string[]>(['']);
  const [education, setEducation] = useState<Education[]>([
    { degree: '', school: '', year: '', cgpa: '', location: '' }
  ]);
  const [certifications, setCertifications] = useState<string[]>(['']);
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    phone: '',
    email: '',
    linkedin: '',
    github: ''
  });
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, { role: '', company: '', year: '', bullets: [''] }]);
  };

  const removeWorkExperience = (index: number) => {
    if (workExperience.length > 1) {
      setWorkExperience(workExperience.filter((_, i) => i !== index));
    }
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperience(updated);
  };

  const addWorkBullet = (workIndex: number) => {
    const updated = [...workExperience];
    updated[workIndex].bullets.push('');
    setWorkExperience(updated);
  };

  const updateWorkBullet = (workIndex: number, bulletIndex: number, value: string) => {
    const updated = [...workExperience];
    updated[workIndex].bullets[bulletIndex] = value;
    setWorkExperience(updated);
  };

  const removeWorkBullet = (workIndex: number, bulletIndex: number) => {
    const updated = [...workExperience];
    if (updated[workIndex].bullets.length > 1) {
      updated[workIndex].bullets.splice(bulletIndex, 1);
      setWorkExperience(updated);
    }
  };

  const addProject = () => {
    setProjects([...projects, { title: '', bullets: [''] }]);
  };

  const removeProject = (index: number) => {
    if (projects.length > 1) {
      setProjects(projects.filter((_, i) => i !== index));
    }
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const addProjectBullet = (projectIndex: number) => {
    const updated = [...projects];
    updated[projectIndex].bullets.push('');
    setProjects(updated);
  };

  const updateProjectBullet = (projectIndex: number, bulletIndex: number, value: string) => {
    const updated = [...projects];
    updated[projectIndex].bullets[bulletIndex] = value;
    setProjects(updated);
  };

  const removeProjectBullet = (projectIndex: number, bulletIndex: number) => {
    const updated = [...projects];
    if (updated[projectIndex].bullets.length > 1) {
      updated[projectIndex].bullets.splice(bulletIndex, 1);
      setProjects(updated);
    }
  };

  const addSkillCategory = () => {
    setSkills([...skills, { category: '', count: 0, list: [] }]);
    setSkillInputs([...skillInputs, '']);
  };

  const updateSkillCategory = (index: number, field: keyof Skill, value: any) => {
    const updated = [...skills];
    if (field === 'list') {
      updated[index] = { ...updated[index], [field]: value, count: value.length };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSkills(updated);
  };

  const removeSkillCategory = (index: number) => {
    if (skills.length > 1) {
      setSkills(skills.filter((_, i) => i !== index));
      setSkillInputs(skillInputs.filter((_, i) => i !== index));
    }
  };

  const addSkillToCategory = (categoryIndex: number, skill: string) => {
    if (skill.trim()) {
      const updated = [...skills];
      updated[categoryIndex].list.push(skill.trim());
      updated[categoryIndex].count = updated[categoryIndex].list.length;
      setSkills(updated);
      setSkillInputs((prev) => {
        const next = [...prev];
        next[categoryIndex] = '';
        return next;
      });
    }
  };

  const removeSkillFromCategory = (categoryIndex: number, skillIndex: number) => {
    const updated = [...skills];
    updated[categoryIndex].list.splice(skillIndex, 1);
    updated[categoryIndex].count = updated[categoryIndex].list.length;
    setSkills(updated);
  };

  const addEducation = () => {
    setEducation([...education, { degree: '', school: '', year: '', cgpa: '', location: '' }]);
  };

  const removeEducation = (index: number) => {
    if (education.length > 1) {
      setEducation(education.filter((_, i) => i !== index));
    }
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const addCertification = () => {
    setCertifications([...certifications, '']);
  };

  const removeCertification = (index: number) => {
    if (certifications.length > 1) {
      setCertifications(certifications.filter((_, i) => i !== index));
    }
  };

  const updateCertification = (index: number, value: string) => {
    const updated = [...certifications];
    updated[index] = value;
    setCertifications(updated);
  };

  const updateContactDetails = (field: keyof ContactDetails, value: string) => {
    setContactDetails(prev => ({ ...prev, [field]: value }));
  };

  const validateCurrentSection = () => {
    const currentSection = missingSections[currentStep];

    if (currentSection === 'workExperience') {
      // At least one experience with role, company, and year
      return workExperience.some(we => 
        we.role.trim().length >= 2 && 
        we.company.trim().length >= 2 && 
        we.year.trim().length >= 4
      );
    }

    if (currentSection === 'projects') {
      // At least one project with title and one bullet
      return projects.some(p => 
        p.title.trim().length >= 3 && 
        p.bullets.some(b => b.trim().length >= 10)
      );
    }

    if (currentSection === 'skills') {
      // At least one skill category with category name and at least one skill
      return skills.some(s => 
        s.category.trim().length >= 2 && 
        s.list.some(item => item.trim().length >= 2)
      );
    }

    if (currentSection === 'education') {
      // At least one education with degree, school, and year
      return education.some(edu => 
        edu.degree.trim().length >= 2 && 
        edu.school.trim().length >= 2 && 
        edu.year.trim().length >= 4
      );
    }

    if (currentSection === 'certifications') {
      // At least one certification with at least 5 characters
      return certifications.some(c => c.trim().length >= 5);
    }

    if (currentSection === 'contactDetails') {
      // Email must be valid format, phone optional but if provided must be valid
      const emailValid = contactDetails.email.trim().includes('@') && 
                        contactDetails.email.trim().includes('.');
      const phoneValid = contactDetails.phone.trim() === '' || 
                        contactDetails.phone.trim().length >= 10;
      return emailValid && phoneValid;
    }

    return false;
  };

  const handleNext = () => {
    if (currentStep < missingSections.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSkipCertifications = () => {
    setCertifications([]);
    if (currentStep < missingSections.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const data: MissingSectionsData = {};

    if (missingSections.includes('workExperience')) {
      data.workExperience = workExperience.filter(we =>
        we.role.trim() && we.company.trim() && we.year.trim()
      ).map(we => ({
        ...we,
        bullets: we.bullets.filter(b => b.trim())
      }));
    }

    if (missingSections.includes('projects')) {
      data.projects = projects.filter(p =>
        p.title.trim() && p.bullets.some(b => b.trim())
      ).map(p => ({
        ...p,
        bullets: p.bullets.filter(b => b.trim())
      }));
    }

    if (missingSections.includes('skills')) {
      data.skills = skills.filter(s =>
        s.category.trim() && s.list.some(item => item.trim())
      ).map(s => ({
        ...s,
        list: s.list.filter(item => item.trim())
      }));
    }

    if (missingSections.includes('education')) {
      data.education = education.filter(edu =>
        edu.degree.trim() && edu.school.trim() && edu.year.trim()
      );
    }

    if (missingSections.includes('certifications')) {
      data.certifications = certifications.filter(c => c.trim());
    }

    if (missingSections.includes('contactDetails')) {
      data.contactDetails = {
        phone: contactDetails.phone.trim(),
        email: contactDetails.email.trim(),
        linkedin: contactDetails.linkedin.trim(),
        github: contactDetails.github.trim(),
      };
    }

    onSectionsProvided(data);
    onClose();
  };

  const currentSection = missingSections[currentStep];
  const isValid = validateCurrentSection();

  const renderWorkExperienceForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6 mt-0 sm:mt-0">
        <div className="bg-cyan-500/15 border border-cyan-400/40 w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-300" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-2">Add Work Experience</h3>
        <p className="text-sm sm:text-base text-slate-300">
          Please provide your work experience details. If you're a fresher and don't have any full-time experience,
          we recommend adding any internships, training, or freelance work you've done. These greatly help in showcasing your skills.
        </p>
      </div>

      {workExperience.map((work, workIndex) => (
        <div key={workIndex} className="border border-slate-700/50 bg-slate-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-100 text-sm sm:text-base">Experience #{workIndex + 1}</h4>
            {workExperience.length > 1 && (
              <button
                onClick={() => removeWorkExperience(workIndex)}
                className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={work.role}
                onChange={(e) => updateWorkExperience(workIndex, 'role', e.target.value)}
                placeholder="e.g., Software Engineer"
                className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company *
              </label>
              <input
                type="text"
                value={work.company}
                onChange={(e) => updateWorkExperience(workIndex, 'company', e.target.value)}
                placeholder="e.g., TechCorp Inc."
                className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration *
            </label>
            <input
              type="text"
              value={work.year}
              onChange={(e) => updateWorkExperience(workIndex, 'year', e.target.value)}
              placeholder="e.g., Jan 2023 - Present"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key Responsibilities
            </label>
            {work.bullets.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateWorkBullet(workIndex, bulletIndex, e.target.value)}
                  placeholder="Describe your responsibility/achievement"
                  className="w-full sm:flex-1 px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
                />
                {work.bullets.length > 1 && (
                  <button
                    onClick={() => removeWorkBullet(workIndex, bulletIndex)}
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-red-300 rounded-lg sm:border-none"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addWorkBullet(workIndex)}
              className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex items-center min-h-[44px] w-full sm:w-auto justify-center sm:justify-start p-2 border border-blue-300 rounded-lg sm:border-none sm:p-0"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Add Responsibility
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addWorkExperience}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Experience
      </button>
    </div>
  );

  const renderProjectsForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-green-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Code className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Projects</h3>
        <p className="text-sm sm:text-base text-gray-600">Please provide your project details</p>
      </div>

      {projects.map((project, projectIndex) => (
        <div key={projectIndex} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Project #{projectIndex + 1}</h4>
            {projects.length > 1 && (
              <button
                onClick={() => removeProject(projectIndex)}
                className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={project.title}
              onChange={(e) => updateProject(projectIndex, 'title', e.target.value)}
              placeholder="e.g., E-commerce Website"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Details
            </label>
            {project.bullets.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateProjectBullet(projectIndex, bulletIndex, e.target.value)}
                  placeholder="Describe what you built/achieved"
                  className="w-full sm:flex-1 px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
                />
                {project.bullets.length > 1 && (
                  <button
                    onClick={() => removeProjectBullet(projectIndex, bulletIndex)}
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-red-300 rounded-lg sm:border-none"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addProjectBullet(projectIndex)}
              className="text-green-600 hover:text-green-700 text-xs sm:text-sm font-medium flex items-center min-h-[44px] w-full sm:w-auto justify-center sm:justify-start p-2 border border-green-300 rounded-lg sm:border-none sm:p-0"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Add Detail
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addProject}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Project
      </button>
    </div>
  );

  const renderSkillsForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-purple-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Target className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Skills</h3>
        <p className="text-sm sm:text-base text-gray-600">Organize your technical skills by category.</p>
      </div>

      {skills.map((skillCategory, categoryIndex) => (
        <div key={categoryIndex} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Skill Category #{categoryIndex + 1}</h4>
            {skills.length > 1 && (
              <button
                onClick={() => removeSkillCategory(categoryIndex)}
                className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={skillCategory.category}
              onChange={(e) => updateSkillCategory(categoryIndex, 'category', e.target.value)}
              placeholder="e.g., Programming Languages, Frameworks, Tools"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Skills (comma-separated or add individually)
            </label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                value={skillInputs[categoryIndex] || ''}
                onChange={(e) => {
                  const next = [...skillInputs];
                  next[categoryIndex] = e.target.value;
                  setSkillInputs(next);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkillToCategory(categoryIndex, skillInputs[categoryIndex] || '');
                  }
                }}
                placeholder="e.g., JavaScript, React, Node.js"
                className="w-full sm:flex-1 px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
              />
              <button
                onClick={() => {
                  addSkillToCategory(categoryIndex, skillInputs[categoryIndex] || '');
                }}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-3 py-3 rounded-lg transition-colors text-sm min-h-[44px]"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skillCategory.list.map((skill: string, skillIndex: number) => (
                <span
                  key={skillIndex}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                >
                  {skill}
                  <button
                    onClick={() => removeSkillFromCategory(categoryIndex, skillIndex)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addSkillCategory}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Skill Category
      </button>
    </div>
  );

  const renderEducationForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-blue-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Education</h3>
        <p className="text-sm sm:text-base text-gray-600">Please provide your educational background.</p>
      </div>

      {education.map((edu, eduIndex) => (
        <div key={eduIndex} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Education #{eduIndex + 1}</h4>
            {education.length > 1 && (
              <button
                onClick={() => removeEducation(eduIndex)}
                className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Degree *</label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEducation(eduIndex, 'degree', e.target.value)}
                placeholder="e.g., Bachelor of Technology"
                className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Institution *</label>
              <input
                type="text"
                value={edu.school}
                onChange={(e) => updateEducation(eduIndex, 'school', e.target.value)}
                placeholder="e.g., University Name"
                className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year *</label>
            <input
              type="text"
              value={edu.year}
              onChange={(e) => updateEducation(eduIndex, 'year', e.target.value)}
              placeholder="e.g., 2020-2024"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CGPA/GPA</label>
            <input
              type="text"
              value={edu.cgpa || ''}
              onChange={(e) => updateEducation(eduIndex, 'cgpa', e.target.value)}
              placeholder="e.g., 8.5/10 or 3.8/4.0"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={edu.location || ''}
              onChange={(e) => updateEducation(eduIndex, 'location', e.target.value)}
              placeholder="e.g., City, State"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>
        </div>
      ))}

      <button
        onClick={addEducation}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Education Entry
      </button>
    </div>
  );

  const renderCertificationsForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-yellow-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Certifications</h3>
        <p className="text-sm sm:text-base text-gray-600">
          Add professional certifications that strengthen your resume. Skip if you don't have any.
        </p>
      </div>

      {certifications.map((cert, index) => (
        <div key={index} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={cert}
            onChange={(e) => updateCertification(index, e.target.value)}
            placeholder="e.g., AWS Certified Solutions Architect"
            className="w-full sm:flex-1 px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
          />
          {certifications.length > 1 && (
            <button
              onClick={() => removeCertification(index)}
              className="w-full sm:w-auto text-red-600 hover:text-red-700 p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-red-300 rounded-lg sm:border-none"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addCertification}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Certification
      </button>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
        <p className="text-xs text-blue-800 dark:text-blue-300 text-center">
          💡 No certifications? That's okay! You can skip this section and proceed.
        </p>
      </div>
    </div>
  );

  const renderContactDetailsForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-yellow-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Contact Details</h3>
        <p className="text-sm sm:text-base text-gray-600">Please provide your contact information</p>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          value={contactDetails.email}
          onChange={(e) => updateContactDetails('email', e.target.value)}
          placeholder="e.g., your.email@example.com"
          className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={contactDetails.phone}
          onChange={(e) => updateContactDetails('phone', e.target.value)}
          placeholder="e.g., +1 (555) 123-4567"
          className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          LinkedIn Profile URL
        </label>
        <input
          type="url"
          value={contactDetails.linkedin}
          onChange={(e) => updateContactDetails('linkedin', e.target.value)}
          placeholder="e.g., https://linkedin.com/in/yourprofile"
          className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          GitHub Profile URL
        </label>
        <input
          type="url"
          value={contactDetails.github}
          onChange={(e) => updateContactDetails('github', e.target.value)}
          placeholder="e.g., https://github.com/yourusername"
          className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
        />
      </div>
    </div>
  );

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'workExperience': return <Briefcase className="w-4 h-4" />;
      case 'projects': return <Code className="w-4 h-4" />;
      case 'skills': return <Target className="w-4 h-4" />;
      case 'education': return <GraduationCap className="w-4 h-4" />;
      case 'certifications': return <Award className="w-4 h-4" />;
      case 'contactDetails': return <Mail className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getSectionName = (section: string) => {
    switch (section) {
      case 'workExperience': return 'Work Experience';
      case 'projects': return 'Projects';
      case 'skills': return 'Skills';
      case 'education': return 'Education';
      case 'certifications': return 'Certifications';
      case 'contactDetails': return 'Contact Details';
      default: return section;
    }
  };

  return (
    <div
      className="fixed inset-0 lg:left-16 z-50 bg-black/70 flex justify-center items-center p-2 sm:p-2 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-slate-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-[0_25px_80px_rgba(16,185,129,0.15)] border border-emerald-400/30 w-full max-w-[95vw] sm:max-w-4xl overflow-y-auto"
        style={{ maxHeight: '80vh', overscrollBehavior: 'contain' }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3 sm:p-6 sm:mb-6 border-b border-amber-400/20">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors rounded-full hover:bg-slate-800/50 min-w-[44px] min-h-[44px]"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="text-center">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-100 mb-2 px-4">
              Complete Your Resume
            </h1>
            <p className="text-sm sm:text-base text-slate-300 px-4">
              We found some missing sections that are important for optimization
            </p>
            <div className="mt-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-3 mx-4">
              <p className="text-xs text-cyan-200">
                💡 <strong>Tip:</strong> Filling these sections will significantly improve your resume's ATS score and job match rate.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-3 sm:p-6 overflow-y-auto grow shrink basis-0 pb-[100px] bg-slate-900/50">
          <div className="flex justify-center sm:justify-between items-center flex-wrap gap-4 sm:gap-6 mb-2 sm:mb-6">
            {missingSections.map((section, index) => (
              <div key={section} className="flex items-center w-auto sm:w-auto">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index < currentStep
                      ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : index === currentStep
                      ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    getSectionIcon(section)
                  )}
                </div>

                <div className="ml-2 hidden sm:block">
                  <div className="text-sm font-medium text-slate-100">
                    {getSectionName(section)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {index < currentStep
                      ? 'Completed'
                      : index === currentStep
                      ? 'Current'
                      : 'Pending'}
                  </div>
                </div>

                {index < missingSections.length - 1 && (
                  <div className={`w-6 h-px mx-2 sm:w-16 sm:h-1 sm:mx-4 transition-all duration-300 ${
                    index < currentStep ? 'bg-emerald-500' : 'bg-slate-700/50'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 grow shrink basis-0 bg-slate-900/50">
          {currentSection === 'workExperience' && renderWorkExperienceForm()}
          {currentSection === 'projects' && renderProjectsForm()}
          {currentSection === 'skills' && renderSkillsForm()}
          {currentSection === 'education' && renderEducationForm()}
          {currentSection === 'certifications' && renderCertificationsForm()}
          {currentSection === 'contactDetails' && renderContactDetailsForm()}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 backdrop-blur-xl p-3 sm:p-6 border-t border-emerald-400/20 flex flex-col gap-2">
          <div className="flex flex-row justify-between items-center gap-3">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex-1 sm:w-auto px-4 py-3 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:border-emerald-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px] flex justify-center items-center"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 order-first sm:order-none">
              Step {currentStep + 1} of {missingSections.length}
            </div>

            <button
              onClick={handleNext}
              disabled={!isValid}
              className="flex-1 sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed text-sm min-h-[44px] flex justify-center items-center"
            >
              <span className="hidden sm:inline">{currentStep === missingSections.length - 1 ? 'Complete' : 'Next'}</span>
              <ArrowRight className="w-4 h-4 sm:ml-2" />
            </button>
          </div>

          {/* Skip button for certifications */}
          {currentSection === 'certifications' && (
            <button
              onClick={handleSkipCertifications}
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline py-2"
            >
              I don't have any certifications (Skip this section)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

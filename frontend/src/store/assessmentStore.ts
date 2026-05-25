import { create } from 'zustand';

export interface AssignmentFormData {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  totalMarks: number;
  duration: number;
  questionTypes: Array<'mcq' | 'short' | 'long' | 'true-false'>;
  numberOfQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  additionalInstructions?: string;
  fileUrl?: string;
}

export interface IQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'short' | 'long' | 'true-false';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: string[];
  answer?: string;
}

export interface ISection {
  id: string;
  title: string;
  instruction: string;
  questions: IQuestion[];
  totalMarks: number;
}

export interface QuestionPaper {
  _id: string;
  assignmentId: string;
  title: string;
  subject: string;
  gradeLevel: string;
  duration: number;
  totalMarks: number;
  sections: ISection[];
  generatedAt: string;
  generationCount?: number;
  metadata: {
    model: string;
    promptTokens?: number;
    completionTokens?: number;
  };
}

interface AssessmentState {
  // Form state
  formData: AssignmentFormData;
  setFormData: (data: Partial<AssignmentFormData>) => void;
  resetForm: () => void;

  // Job tracking
  currentJobId: string | null;
  currentAssignmentId: string | null;
  jobStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  setJobStatus: (
    status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed',
    ids?: { jobId?: string; assignmentId?: string }
  ) => void;

  // Generated paper
  generatedPaper: QuestionPaper | null;
  setGeneratedPaper: (paper: QuestionPaper) => void;
}

const defaultFormData: AssignmentFormData = {
  title: '',
  subject: '',
  gradeLevel: '',
  dueDate: '',
  totalMarks: 100,
  duration: 60,
  questionTypes: ['mcq'],
  numberOfQuestions: 10,
  difficulty: 'medium'
};

export const useAssessmentStore = create<AssessmentState>((set) => ({
  formData: { ...defaultFormData },
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () => set({ formData: { ...defaultFormData } }),

  currentJobId: null,
  currentAssignmentId: null,
  jobStatus: 'idle',
  setJobStatus: (status, ids) => set((state) => {
    const newState: Partial<AssessmentState> = { jobStatus: status };
    if (ids?.jobId !== undefined) newState.currentJobId = ids.jobId;
    if (ids?.assignmentId !== undefined) newState.currentAssignmentId = ids.assignmentId;
    return newState;
  }),

  generatedPaper: null,
  setGeneratedPaper: (paper) => set({ generatedPaper: paper })
}));



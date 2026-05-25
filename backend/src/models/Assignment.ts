import mongoose, { Schema, Document, Types } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Types / Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionType = 'mcq' | 'short' | 'long' | 'true-false';
export type Difficulty   = 'easy' | 'medium' | 'hard' | 'mixed';
export type AssignmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IAssignment extends Document {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: Date;
  totalMarks: number;
  /** Duration of the assessment in minutes */
  duration: number;
  questionTypes: QuestionType[];
  numberOfQuestions: number;
  difficulty: Difficulty;
  additionalInstructions?: string;
  /** URL to any supporting file (syllabus, rubric, etc.) */
  fileUrl?: string;
  status: AssignmentStatus;
  /** BullMQ job ID returned when the generation job is enqueued */
  jobId?: string;
  /** Reference to the generated QuestionPaper document */
  resultId?: Types.ObjectId;
  /** Tracks how many times this assignment has been generated */
  generationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title must not exceed 200 characters'],
    },

    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },

    gradeLevel: {
      type: String,
      required: [true, 'Grade level is required'],
      trim: true,
    },

    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },

    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: [1, 'Total marks must be at least 1'],
    },

    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },

    questionTypes: {
      type: [String],
      enum: {
        values: ['mcq', 'short', 'long', 'true-false'] satisfies QuestionType[],
        message: '{VALUE} is not a supported question type',
      },
      required: [true, 'At least one question type is required'],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'questionTypes must have at least one entry',
      },
    },

    numberOfQuestions: {
      type: Number,
      required: [true, 'Number of questions is required'],
      min: [1, 'Must have at least 1 question'],
      max: [200, 'Cannot exceed 200 questions'],
    },

    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard', 'mixed'] satisfies Difficulty[],
        message: '{VALUE} is not a valid difficulty level',
      },
      required: [true, 'Difficulty is required'],
    },

    additionalInstructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Instructions must not exceed 2000 characters'],
    },

    fileUrl: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'] satisfies AssignmentStatus[],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending' satisfies AssignmentStatus,
    },

    jobId: {
      type: String,
    },

    resultId: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionPaper',
    },

    generationCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    // Return virtuals when converting to JSON (e.g. for API responses)
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────────────────────

AssignmentSchema.index({ status: 1 });
AssignmentSchema.index({ subject: 1, gradeLevel: 1 });
AssignmentSchema.index({ createdAt: -1 });

// ─────────────────────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────────────────────

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);

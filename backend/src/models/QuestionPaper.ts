import mongoose, { Schema, Document, Types } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-document interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type PaperQuestionType = 'mcq' | 'short' | 'long' | 'true-false';
export type PaperDifficulty   = 'easy' | 'medium' | 'hard';

export interface IQuestion {
  /** Stable client-facing ID (e.g. "q_1") */
  id: string;
  text: string;
  type: PaperQuestionType;
  difficulty: PaperDifficulty;
  marks: number;
  /** Only present for MCQ questions */
  options?: string[];
  /** Model answer / correct option */
  answer?: string;
}

export interface ISection {
  /** Stable client-facing ID (e.g. "sec_A") */
  id: string;
  /** Human-readable section name, e.g. "Section A" */
  title: string;
  /** Instruction shown at the top of this section, e.g. "Attempt all questions" */
  instruction: string;
  questions: IQuestion[];
  /** Sum of marks for all questions in this section */
  totalMarks: number;
}

export interface IMetadata {
  /** AI model used for generation, e.g. "claude-3-5-sonnet-20241022" */
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Document interface
// ─────────────────────────────────────────────────────────────────────────────

export interface IQuestionPaper extends Document {
  assignmentId: Types.ObjectId;
  title: string;
  subject: string;
  gradeLevel: string;
  /** Exam duration in minutes */
  duration: number;
  totalMarks: number;
  sections: ISection[];
  generatedAt: Date;
  metadata: IMetadata;
  generationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-document schemas
// ─────────────────────────────────────────────────────────────────────────────

const QuestionSchema = new Schema<IQuestion>(
  {
    id: { type: String, required: true },

    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },

    type: {
      type: String,
      enum: {
        values: ['mcq', 'short', 'long', 'true-false'] satisfies PaperQuestionType[],
        message: '{VALUE} is not a valid question type',
      },
      required: [true, 'Question type is required'],
    },

    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'] satisfies PaperDifficulty[],
        message: '{VALUE} is not a valid difficulty level',
      },
      required: [true, 'Difficulty is required'],
    },

    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [0, 'Marks cannot be negative'],
    },

    options: {
      type: [String],
      // Only required when type is 'mcq'; validated at application layer
    },

    answer: {
      type: String,
      trim: true,
    },
  },
  { _id: false } // use our own `id` field — no auto-generated _id
);

const SectionSchema = new Schema<ISection>(
  {
    id: { type: String, required: true },

    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
    },

    instruction: {
      type: String,
      required: [true, 'Section instruction is required'],
      trim: true,
    },

    questions: {
      type: [QuestionSchema],
      required: true,
      validate: {
        validator: (v: IQuestion[]) => v.length > 0,
        message: 'A section must have at least one question',
      },
    },

    totalMarks: {
      type: Number,
      required: [true, 'Section total marks is required'],
      min: [0, 'Total marks cannot be negative'],
    },
  },
  { _id: false }
);

const MetadataSchema = new Schema<IMetadata>(
  {
    model: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
    },
    promptTokens:     { type: Number, min: 0 },
    completionTokens: { type: Number, min: 0 },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// Root schema
// ─────────────────────────────────────────────────────────────────────────────

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
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

    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },

    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: [1, 'Total marks must be at least 1'],
    },

    sections: {
      type: [SectionSchema],
      required: true,
      validate: {
        validator: (v: ISection[]) => v.length > 0,
        message: 'A question paper must have at least one section',
      },
    },

    generatedAt: {
      type: Date,
      required: [true, 'generatedAt is required'],
      default: () => new Date(),
    },

    metadata: {
      type: MetadataSchema,
      required: [true, 'Metadata is required'],
    },

    generationCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Virtual: total question count across all sections
// ─────────────────────────────────────────────────────────────────────────────

QuestionPaperSchema.virtual('totalQuestions').get(function (
  this: IQuestionPaper
) {
  return this.sections.reduce((sum, s) => sum + s.questions.length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────────────────────

QuestionPaperSchema.index({ assignmentId: 1 }, { unique: true });
QuestionPaperSchema.index({ subject: 1, gradeLevel: 1 });
QuestionPaperSchema.index({ generatedAt: -1 });

// ─────────────────────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────────────────────

export const QuestionPaper = mongoose.model<IQuestionPaper>(
  'QuestionPaper',
  QuestionPaperSchema
);

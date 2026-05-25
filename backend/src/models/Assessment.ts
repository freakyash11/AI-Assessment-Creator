import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessment extends Document {
  title: string;
  subject: string;
  gradeLevel: string;
  questions: unknown[];
  status: 'pending' | 'generating' | 'ready' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    questions: { type: [Schema.Types.Mixed], default: [] },
    status: {
      type: String,
      enum: ['pending', 'generating', 'ready', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);

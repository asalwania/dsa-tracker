import mongoose, { Schema, type Document, type Model } from 'mongoose';

/** Valid progress statuses */
export type ProgressStatus = 'solved' | 'attempted' | 'skipped' | 'pending';

/** Progress document interface */
export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  problemId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  completed: boolean;
  status: ProgressStatus;
  notes: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem ID is required'],
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic ID is required'],
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: ['solved', 'attempted', 'skipped', 'pending'],
        message: 'Status must be solved, attempted, skipped, or pending',
      },
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
        return ret;
      },
    },
  },
);

/** Compound unique index: one progress entry per user per problem */
progressSchema.index({ userId: 1, problemId: 1 }, { unique: true });

/** Index for fetching all progress for a user within a topic */
progressSchema.index({ userId: 1, topicId: 1 });

/** Index for leaderboard queries (completed count per user) */
progressSchema.index({ userId: 1, completed: 1 });

export const Progress: Model<IProgress> = mongoose.model<IProgress>('Progress', progressSchema);

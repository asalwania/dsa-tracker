import mongoose, { Schema, type Document, type Model } from 'mongoose';

/** Problem document interface */
export interface IProblem extends Document {
  slug: string;
  title: string;
  topicId: mongoose.Types.ObjectId;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  platform: 'leetcode' | 'gfg' | 'codeforces';
  problemUrl: string;
  youtubeUrl: string;
  articleUrl: string;
  companies: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const problemSchema = new Schema<IProblem>(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic ID is required'],
      index: true,
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be easy, medium, or hard',
      },
      required: [true, 'Difficulty is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    platform: {
      type: String,
      enum: {
        values: ['leetcode', 'gfg', 'codeforces'],
        message: 'Platform must be leetcode, gfg, or codeforces',
      },
      required: [true, 'Platform is required'],
    },
    problemUrl: {
      type: String,
      required: [true, 'Problem URL is required'],
      trim: true,
    },
    youtubeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    articleUrl: {
      type: String,
      default: '',
      trim: true,
    },
    companies: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      min: [1, 'Order must be at least 1'],
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

/** Compound index for ordering problems within a topic */
problemSchema.index({ topicId: 1, order: 1 });

/** Index for slug lookups */
problemSchema.index({ slug: 1 }, { unique: true });

/** Index for difficulty filtering */
problemSchema.index({ difficulty: 1 });

/** Index for platform filtering */
problemSchema.index({ platform: 1 });

export const Problem: Model<IProblem> = mongoose.model<IProblem>('Problem', problemSchema);

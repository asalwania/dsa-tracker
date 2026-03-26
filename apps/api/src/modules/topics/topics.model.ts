import mongoose, { Schema, type Document, type Model } from 'mongoose';

/** Topic document interface */
export interface ITopic extends Document {
  slug: string;
  title: string;
  description: string;
  order: number;
  icon: string;
  totalProblems: number;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
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
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      min: [1, 'Order must be at least 1'],
    },
    icon: {
      type: String,
      default: '',
    },
    totalProblems: {
      type: Number,
      default: 0,
      min: 0,
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

/** Index for ordering topics */
topicSchema.index({ order: 1 });

/** Index for slug lookups */
topicSchema.index({ slug: 1 }, { unique: true });

export const Topic: Model<ITopic> = mongoose.model<ITopic>('Topic', topicSchema);

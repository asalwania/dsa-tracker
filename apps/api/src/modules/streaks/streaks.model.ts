import mongoose, { Schema, type Document, type Model } from 'mongoose';

/** Streak document interface */
export interface IStreak extends Document {
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  lastActivityDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const streakSchema = new Schema<IStreak>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityDate: {
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

/** Index for leaderboard queries (sort by totalSolved) */
streakSchema.index({ totalSolved: -1 });

/** Index for leaderboard queries (sort by currentStreak) */
streakSchema.index({ currentStreak: -1 });

export const Streak: Model<IStreak> = mongoose.model<IStreak>('Streak', streakSchema);

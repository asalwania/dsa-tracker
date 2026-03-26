import mongoose, { Schema, type Document, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

/** User document interface */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  avatar: string;
  googleId: string;
  githubId: string;
  tokenFamily: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const SALT_ROUNDS = 12;

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      default: '',
      sparse: true,
    },
    githubId: {
      type: String,
      default: '',
      sparse: true,
    },
    tokenFamily: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
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
        delete ret['password'];
        delete ret['tokenFamily'];
        return ret;
      },
    },
  },
);

/** Index for email lookups */
userSchema.index({ email: 1 }, { unique: true });

/** Sparse index for Google OAuth lookups */
userSchema.index({ googleId: 1 }, { sparse: true });

/** Sparse index for GitHub OAuth lookups */
userSchema.index({ githubId: 1 }, { sparse: true });

/**
 * Pre-save hook: hashes the password if it has been modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Instance method: compares a candidate password against the hashed password.
 * @param candidatePassword - Plain-text password to verify
 * @returns True if the password matches
 */
userSchema.methods['comparePassword'] = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

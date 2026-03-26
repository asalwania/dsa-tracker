import { Topic, type ITopic } from './topics.model.js';
import { AppError } from '../../utils/AppError.js';
import { cacheGet, cacheSet, cacheDeletePattern } from '../../utils/cache.js';
import type { CreateTopicInput, UpdateTopicInput } from './topics.types.js';

/** Cache key prefix for topics */
const CACHE_PREFIX = 'cache:topics';

/** Cache TTL in seconds (10 minutes) */
const CACHE_TTL = 600;

/**
 * Service layer for topic operations.
 * Handles data access, caching, and business logic for DSA topics.
 */
export const topicsService = {
  /**
   * Retrieves all topics ordered by their display order.
   * Results are cached for 10 minutes.
   * @returns Array of topic documents
   */
  async getAll(): Promise<ITopic[]> {
    const cacheKey = `${CACHE_PREFIX}:all`;
    const cached = await cacheGet<ITopic[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const topics = await Topic.find().sort({ order: 1 }).lean<ITopic[]>();
    await cacheSet(cacheKey, topics, CACHE_TTL);
    return topics;
  },

  /**
   * Retrieves a single topic by its URL slug.
   * Results are cached for 10 minutes.
   * @param slug - The topic's URL-friendly slug
   * @returns Topic document
   * @throws AppError.notFound if the topic does not exist
   */
  async getBySlug(slug: string): Promise<ITopic> {
    const cacheKey = `${CACHE_PREFIX}:slug:${slug}`;
    const cached = await cacheGet<ITopic>(cacheKey);
    if (cached) {
      return cached;
    }

    const topic = await Topic.findOne({ slug }).lean<ITopic>();
    if (!topic) {
      throw AppError.notFound(`Topic with slug '${slug}' not found`, 'TOPIC_NOT_FOUND');
    }

    await cacheSet(cacheKey, topic, CACHE_TTL);
    return topic;
  },

  /**
   * Retrieves a single topic by its ID.
   * @param id - The topic's MongoDB ObjectId
   * @returns Topic document
   * @throws AppError.notFound if the topic does not exist
   */
  async getById(id: string): Promise<ITopic> {
    const topic = await Topic.findById(id).lean<ITopic>();
    if (!topic) {
      throw AppError.notFound(`Topic with id '${id}' not found`, 'TOPIC_NOT_FOUND');
    }
    return topic;
  },

  /**
   * Creates a new topic.
   * Invalidates the topics cache after creation.
   * @param data - Topic creation data
   * @returns The created topic document
   * @throws AppError.conflict if a topic with the same slug already exists
   */
  async create(data: CreateTopicInput): Promise<ITopic> {
    const existing = await Topic.findOne({ slug: data.slug });
    if (existing) {
      throw AppError.conflict(`Topic with slug '${data.slug}' already exists`, 'TOPIC_EXISTS');
    }

    const topic = await Topic.create(data);
    await cacheDeletePattern(`${CACHE_PREFIX}:*`);
    return topic.toJSON() as ITopic;
  },

  /**
   * Updates an existing topic by ID.
   * Invalidates the topics cache after update.
   * @param id - The topic's MongoDB ObjectId
   * @param data - Partial topic update data
   * @returns The updated topic document
   * @throws AppError.notFound if the topic does not exist
   */
  async update(id: string, data: UpdateTopicInput): Promise<ITopic> {
    const topic = await Topic.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean<ITopic>();

    if (!topic) {
      throw AppError.notFound(`Topic with id '${id}' not found`, 'TOPIC_NOT_FOUND');
    }

    await cacheDeletePattern(`${CACHE_PREFIX}:*`);
    return topic;
  },

  /**
   * Deletes a topic by ID.
   * Invalidates the topics cache after deletion.
   * @param id - The topic's MongoDB ObjectId
   * @throws AppError.notFound if the topic does not exist
   */
  async delete(id: string): Promise<void> {
    const topic = await Topic.findByIdAndDelete(id);
    if (!topic) {
      throw AppError.notFound(`Topic with id '${id}' not found`, 'TOPIC_NOT_FOUND');
    }
    await cacheDeletePattern(`${CACHE_PREFIX}:*`);
  },
};

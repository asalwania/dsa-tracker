import { Problem, type IProblem } from './problems.model.js';
import { Topic } from '../topics/topics.model.js';
import { AppError } from '../../utils/AppError.js';
import { cacheGet, cacheSet, cacheDeletePattern } from '../../utils/cache.js';
import type { CreateProblemInput, UpdateProblemInput, ListProblemsQuery } from './problems.types.js';
import type { PaginationMeta } from '../../utils/response.js';

/** Cache key prefix for problems */
const CACHE_PREFIX = 'cache:problems';

/** Cache TTL in seconds (10 minutes) */
const CACHE_TTL = 600;

/**
 * Service layer for problem operations.
 * Handles data access, caching, and business logic for DSA problems.
 */
export const problemsService = {
  /**
   * Retrieves a paginated, filterable list of problems.
   * Results are cached for 10 minutes based on the query parameters.
   * @param query - Filter and pagination parameters
   * @returns Object containing problems array and pagination metadata
   */
  async getAll(
    query: ListProblemsQuery,
  ): Promise<{ problems: IProblem[]; pagination: PaginationMeta }> {
    const { topicId, difficulty, platform, page, limit } = query;
    const cacheKey = `${CACHE_PREFIX}:list:${topicId ?? 'all'}:${difficulty ?? 'all'}:${platform ?? 'all'}:${page}:${limit}`;

    const cached = await cacheGet<{ problems: IProblem[]; pagination: PaginationMeta }>(cacheKey);
    if (cached) {
      return cached;
    }

    const filter: Record<string, unknown> = {};
    if (topicId) filter['topicId'] = topicId;
    if (difficulty) filter['difficulty'] = difficulty;
    if (platform) filter['platform'] = platform;

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .sort({ topicId: 1, order: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<IProblem[]>(),
      Problem.countDocuments(filter),
    ]);

    const pagination: PaginationMeta = {
      total,
      page,
      limit,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };

    const result = { problems, pagination };
    await cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  },

  /**
   * Retrieves all problems for a specific topic, ordered by display order.
   * Results are cached for 10 minutes.
   * @param topicId - The topic's MongoDB ObjectId
   * @returns Array of problem documents
   */
  async getByTopic(topicId: string): Promise<IProblem[]> {
    const cacheKey = `${CACHE_PREFIX}:topic:${topicId}`;
    const cached = await cacheGet<IProblem[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const problems = await Problem.find({ topicId })
      .sort({ order: 1 })
      .lean<IProblem[]>();

    await cacheSet(cacheKey, problems, CACHE_TTL);
    return problems;
  },

  /**
   * Retrieves a single problem by its URL slug.
   * Results are cached for 10 minutes.
   * @param slug - The problem's URL-friendly slug
   * @returns Problem document
   * @throws AppError.notFound if the problem does not exist
   */
  async getBySlug(slug: string): Promise<IProblem> {
    const cacheKey = `${CACHE_PREFIX}:slug:${slug}`;
    const cached = await cacheGet<IProblem>(cacheKey);
    if (cached) {
      return cached;
    }

    const problem = await Problem.findOne({ slug }).lean<IProblem>();
    if (!problem) {
      throw AppError.notFound(`Problem with slug '${slug}' not found`, 'PROBLEM_NOT_FOUND');
    }

    await cacheSet(cacheKey, problem, CACHE_TTL);
    return problem;
  },

  /**
   * Creates a new problem and updates the parent topic's problem count.
   * Invalidates the problems cache after creation.
   * @param data - Problem creation data
   * @returns The created problem document
   * @throws AppError.conflict if a problem with the same slug exists
   * @throws AppError.notFound if the referenced topic does not exist
   */
  async create(data: CreateProblemInput): Promise<IProblem> {
    // Verify the topic exists
    const topic = await Topic.findById(data.topicId);
    if (!topic) {
      throw AppError.notFound(`Topic with id '${data.topicId}' not found`, 'TOPIC_NOT_FOUND');
    }

    const existing = await Problem.findOne({ slug: data.slug });
    if (existing) {
      throw AppError.conflict(
        `Problem with slug '${data.slug}' already exists`,
        'PROBLEM_EXISTS',
      );
    }

    const problem = await Problem.create(data);

    // Update the topic's total problem count
    await Topic.findByIdAndUpdate(data.topicId, { $inc: { totalProblems: 1 } });

    await cacheDeletePattern(`${CACHE_PREFIX}:*`);
    await cacheDeletePattern('cache:topics:*');

    return problem.toJSON() as IProblem;
  },

  /**
   * Updates an existing problem by ID.
   * Invalidates the problems cache after update.
   * @param id - The problem's MongoDB ObjectId
   * @param data - Partial problem update data
   * @returns The updated problem document
   * @throws AppError.notFound if the problem does not exist
   */
  async update(id: string, data: UpdateProblemInput): Promise<IProblem> {
    const problem = await Problem.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean<IProblem>();

    if (!problem) {
      throw AppError.notFound(`Problem with id '${id}' not found`, 'PROBLEM_NOT_FOUND');
    }

    await cacheDeletePattern(`${CACHE_PREFIX}:*`);
    return problem;
  },

  /**
   * Deletes a problem by ID and decrements the parent topic's problem count.
   * Invalidates the problems cache after deletion.
   * @param id - The problem's MongoDB ObjectId
   * @throws AppError.notFound if the problem does not exist
   */
  async delete(id: string): Promise<void> {
    const problem = await Problem.findByIdAndDelete(id);
    if (!problem) {
      throw AppError.notFound(`Problem with id '${id}' not found`, 'PROBLEM_NOT_FOUND');
    }

    // Decrement the topic's total problem count
    await Topic.findByIdAndUpdate(problem.topicId, { $inc: { totalProblems: -1 } });

    await cacheDeletePattern(`${CACHE_PREFIX}:*`);
    await cacheDeletePattern('cache:topics:*');
  },
};

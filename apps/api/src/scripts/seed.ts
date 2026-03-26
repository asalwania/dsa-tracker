import mongoose from 'mongoose';
import { Topic } from '../modules/topics/topics.model.js';
import { Problem } from '../modules/problems/problems.model.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Topic seed data: 10 core DSA topics.
 */
const topicsSeed = [
  { slug: 'arrays', title: 'Arrays', description: 'Master array manipulation, searching, sorting, and two-pointer techniques.', order: 1, icon: '📊' },
  { slug: 'strings', title: 'Strings', description: 'String matching, manipulation, and pattern recognition problems.', order: 2, icon: '🔤' },
  { slug: 'linked-lists', title: 'Linked Lists', description: 'Singly, doubly, and circular linked list operations and pointer techniques.', order: 3, icon: '🔗' },
  { slug: 'stacks-queues', title: 'Stacks & Queues', description: 'Stack and queue operations, monotonic stacks, and deque problems.', order: 4, icon: '📚' },
  { slug: 'trees', title: 'Trees', description: 'Binary trees, BSTs, tree traversals, and construction problems.', order: 5, icon: '🌳' },
  { slug: 'graphs', title: 'Graphs', description: 'BFS, DFS, shortest path, topological sort, and union-find problems.', order: 6, icon: '🕸️' },
  { slug: 'dynamic-programming', title: 'Dynamic Programming', description: 'Memoization, tabulation, and classic DP patterns for optimization problems.', order: 7, icon: '🧮' },
  { slug: 'binary-search', title: 'Binary Search', description: 'Binary search on sorted arrays, search space reduction, and boundary finding.', order: 8, icon: '🔍' },
  { slug: 'greedy', title: 'Greedy Algorithms', description: 'Greedy choice property problems including interval scheduling and optimization.', order: 9, icon: '💰' },
  { slug: 'backtracking', title: 'Backtracking', description: 'Recursive exploration with constraint satisfaction and pruning techniques.', order: 10, icon: '🔙' },
];

/**
 * Problem seed data organized by topic slug.
 * Each topic has 5-7 real LeetCode problems.
 */
const problemsSeed: Record<
  string,
  Array<{
    slug: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    platform: 'leetcode';
    problemUrl: string;
    youtubeUrl: string;
    articleUrl: string;
    companies: string[];
    order: number;
  }>
> = {
  arrays: [
    { slug: 'two-sum', title: 'Two Sum', difficulty: 'easy', tags: ['array', 'hash-table'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/two-sum/', youtubeUrl: 'https://www.youtube.com/results?search_query=two+sum+leetcode', articleUrl: 'https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/', companies: ['Google', 'Amazon', 'Meta'], order: 1 },
    { slug: 'best-time-to-buy-and-sell-stock', title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', tags: ['array', 'dynamic-programming'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', youtubeUrl: 'https://www.youtube.com/results?search_query=best+time+to+buy+and+sell+stock', articleUrl: 'https://takeuforward.org/data-structure/stock-buy-and-sell/', companies: ['Amazon', 'Goldman Sachs', 'Meta'], order: 2 },
    { slug: 'container-with-most-water', title: 'Container With Most Water', difficulty: 'medium', tags: ['array', 'two-pointers', 'greedy'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/container-with-most-water/', youtubeUrl: 'https://www.youtube.com/results?search_query=container+with+most+water', articleUrl: '', companies: ['Amazon', 'Google', 'Bloomberg'], order: 3 },
    { slug: '3sum', title: '3Sum', difficulty: 'medium', tags: ['array', 'two-pointers', 'sorting'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/3sum/', youtubeUrl: 'https://www.youtube.com/results?search_query=3sum+leetcode', articleUrl: 'https://takeuforward.org/data-structure/3-sum-find-all-triplets-that-add-up-to-zero/', companies: ['Meta', 'Amazon', 'Apple'], order: 4 },
    { slug: 'trapping-rain-water', title: 'Trapping Rain Water', difficulty: 'hard', tags: ['array', 'two-pointers', 'stack', 'dynamic-programming'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/trapping-rain-water/', youtubeUrl: 'https://www.youtube.com/results?search_query=trapping+rain+water', articleUrl: 'https://takeuforward.org/data-structure/trapping-rainwater/', companies: ['Google', 'Amazon', 'Goldman Sachs'], order: 5 },
    { slug: 'product-of-array-except-self', title: 'Product of Array Except Self', difficulty: 'medium', tags: ['array', 'prefix-sum'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/product-of-array-except-self/', youtubeUrl: 'https://www.youtube.com/results?search_query=product+of+array+except+self', articleUrl: '', companies: ['Amazon', 'Apple', 'Meta'], order: 6 },
  ],
  strings: [
    { slug: 'valid-anagram', title: 'Valid Anagram', difficulty: 'easy', tags: ['string', 'hash-table', 'sorting'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/valid-anagram/', youtubeUrl: 'https://www.youtube.com/results?search_query=valid+anagram', articleUrl: '', companies: ['Amazon', 'Microsoft'], order: 1 },
    { slug: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', tags: ['string', 'sliding-window', 'hash-table'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', youtubeUrl: 'https://www.youtube.com/results?search_query=longest+substring+without+repeating', articleUrl: 'https://takeuforward.org/data-structure/length-of-longest-substring-without-any-repeating-character/', companies: ['Amazon', 'Google', 'Meta'], order: 2 },
    { slug: 'longest-palindromic-substring', title: 'Longest Palindromic Substring', difficulty: 'medium', tags: ['string', 'dynamic-programming'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/longest-palindromic-substring/', youtubeUrl: 'https://www.youtube.com/results?search_query=longest+palindromic+substring', articleUrl: '', companies: ['Amazon', 'Microsoft', 'Google'], order: 3 },
    { slug: 'group-anagrams', title: 'Group Anagrams', difficulty: 'medium', tags: ['string', 'hash-table', 'sorting'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/group-anagrams/', youtubeUrl: 'https://www.youtube.com/results?search_query=group+anagrams', articleUrl: '', companies: ['Amazon', 'Meta', 'Google'], order: 4 },
    { slug: 'minimum-window-substring', title: 'Minimum Window Substring', difficulty: 'hard', tags: ['string', 'sliding-window', 'hash-table'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/minimum-window-substring/', youtubeUrl: 'https://www.youtube.com/results?search_query=minimum+window+substring', articleUrl: '', companies: ['Meta', 'Google', 'Uber'], order: 5 },
  ],
  'linked-lists': [
    { slug: 'reverse-linked-list', title: 'Reverse Linked List', difficulty: 'easy', tags: ['linked-list', 'recursion'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/reverse-linked-list/', youtubeUrl: 'https://www.youtube.com/results?search_query=reverse+linked+list', articleUrl: 'https://takeuforward.org/data-structure/reverse-a-linked-list/', companies: ['Amazon', 'Microsoft', 'Apple'], order: 1 },
    { slug: 'merge-two-sorted-lists', title: 'Merge Two Sorted Lists', difficulty: 'easy', tags: ['linked-list', 'recursion'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/', youtubeUrl: 'https://www.youtube.com/results?search_query=merge+two+sorted+lists', articleUrl: '', companies: ['Amazon', 'Microsoft', 'Google'], order: 2 },
    { slug: 'linked-list-cycle', title: 'Linked List Cycle', difficulty: 'easy', tags: ['linked-list', 'two-pointers'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/linked-list-cycle/', youtubeUrl: 'https://www.youtube.com/results?search_query=linked+list+cycle', articleUrl: '', companies: ['Amazon', 'Microsoft'], order: 3 },
    { slug: 'remove-nth-node-from-end-of-list', title: 'Remove Nth Node From End of List', difficulty: 'medium', tags: ['linked-list', 'two-pointers'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', youtubeUrl: 'https://www.youtube.com/results?search_query=remove+nth+node+from+end', articleUrl: '', companies: ['Meta', 'Amazon'], order: 4 },
    { slug: 'merge-k-sorted-lists', title: 'Merge k Sorted Lists', difficulty: 'hard', tags: ['linked-list', 'divide-and-conquer', 'heap'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/merge-k-sorted-lists/', youtubeUrl: 'https://www.youtube.com/results?search_query=merge+k+sorted+lists', articleUrl: '', companies: ['Amazon', 'Meta', 'Google'], order: 5 },
  ],
  'stacks-queues': [
    { slug: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'easy', tags: ['stack', 'string'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/valid-parentheses/', youtubeUrl: 'https://www.youtube.com/results?search_query=valid+parentheses', articleUrl: '', companies: ['Amazon', 'Google', 'Meta'], order: 1 },
    { slug: 'min-stack', title: 'Min Stack', difficulty: 'medium', tags: ['stack', 'design'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/min-stack/', youtubeUrl: 'https://www.youtube.com/results?search_query=min+stack', articleUrl: '', companies: ['Amazon', 'Microsoft', 'Bloomberg'], order: 2 },
    { slug: 'daily-temperatures', title: 'Daily Temperatures', difficulty: 'medium', tags: ['stack', 'monotonic-stack'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/daily-temperatures/', youtubeUrl: 'https://www.youtube.com/results?search_query=daily+temperatures', articleUrl: '', companies: ['Google', 'Amazon'], order: 3 },
    { slug: 'evaluate-reverse-polish-notation', title: 'Evaluate Reverse Polish Notation', difficulty: 'medium', tags: ['stack', 'math'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', youtubeUrl: 'https://www.youtube.com/results?search_query=evaluate+reverse+polish+notation', articleUrl: '', companies: ['Amazon', 'LinkedIn'], order: 4 },
    { slug: 'largest-rectangle-in-histogram', title: 'Largest Rectangle in Histogram', difficulty: 'hard', tags: ['stack', 'monotonic-stack'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', youtubeUrl: 'https://www.youtube.com/results?search_query=largest+rectangle+in+histogram', articleUrl: '', companies: ['Google', 'Amazon', 'Microsoft'], order: 5 },
  ],
  trees: [
    { slug: 'maximum-depth-of-binary-tree', title: 'Maximum Depth of Binary Tree', difficulty: 'easy', tags: ['tree', 'dfs', 'bfs'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', youtubeUrl: 'https://www.youtube.com/results?search_query=maximum+depth+binary+tree', articleUrl: '', companies: ['Amazon', 'Google'], order: 1 },
    { slug: 'invert-binary-tree', title: 'Invert Binary Tree', difficulty: 'easy', tags: ['tree', 'dfs', 'bfs'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/invert-binary-tree/', youtubeUrl: 'https://www.youtube.com/results?search_query=invert+binary+tree', articleUrl: '', companies: ['Google', 'Amazon'], order: 2 },
    { slug: 'binary-tree-level-order-traversal', title: 'Binary Tree Level Order Traversal', difficulty: 'medium', tags: ['tree', 'bfs'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', youtubeUrl: 'https://www.youtube.com/results?search_query=binary+tree+level+order+traversal', articleUrl: '', companies: ['Amazon', 'Meta', 'Microsoft'], order: 3 },
    { slug: 'validate-binary-search-tree', title: 'Validate Binary Search Tree', difficulty: 'medium', tags: ['tree', 'dfs', 'bst'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/validate-binary-search-tree/', youtubeUrl: 'https://www.youtube.com/results?search_query=validate+binary+search+tree', articleUrl: '', companies: ['Amazon', 'Meta', 'Bloomberg'], order: 4 },
    { slug: 'binary-tree-maximum-path-sum', title: 'Binary Tree Maximum Path Sum', difficulty: 'hard', tags: ['tree', 'dfs', 'dynamic-programming'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', youtubeUrl: 'https://www.youtube.com/results?search_query=binary+tree+maximum+path+sum', articleUrl: '', companies: ['Google', 'Meta', 'Microsoft'], order: 5 },
    { slug: 'lowest-common-ancestor-of-a-binary-tree', title: 'Lowest Common Ancestor of a Binary Tree', difficulty: 'medium', tags: ['tree', 'dfs'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', youtubeUrl: 'https://www.youtube.com/results?search_query=lowest+common+ancestor+binary+tree', articleUrl: '', companies: ['Meta', 'Amazon', 'Microsoft'], order: 6 },
  ],
  graphs: [
    { slug: 'number-of-islands', title: 'Number of Islands', difficulty: 'medium', tags: ['graph', 'dfs', 'bfs', 'union-find'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/number-of-islands/', youtubeUrl: 'https://www.youtube.com/results?search_query=number+of+islands', articleUrl: 'https://takeuforward.org/data-structure/number-of-islands/', companies: ['Amazon', 'Google', 'Meta'], order: 1 },
    { slug: 'clone-graph', title: 'Clone Graph', difficulty: 'medium', tags: ['graph', 'dfs', 'bfs', 'hash-table'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/clone-graph/', youtubeUrl: 'https://www.youtube.com/results?search_query=clone+graph', articleUrl: '', companies: ['Meta', 'Google', 'Amazon'], order: 2 },
    { slug: 'course-schedule', title: 'Course Schedule', difficulty: 'medium', tags: ['graph', 'topological-sort', 'dfs', 'bfs'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/course-schedule/', youtubeUrl: 'https://www.youtube.com/results?search_query=course+schedule', articleUrl: '', companies: ['Amazon', 'Microsoft', 'Google'], order: 3 },
    { slug: 'pacific-atlantic-water-flow', title: 'Pacific Atlantic Water Flow', difficulty: 'medium', tags: ['graph', 'dfs', 'bfs', 'matrix'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', youtubeUrl: 'https://www.youtube.com/results?search_query=pacific+atlantic+water+flow', articleUrl: '', companies: ['Google', 'Amazon'], order: 4 },
    { slug: 'word-ladder', title: 'Word Ladder', difficulty: 'hard', tags: ['graph', 'bfs', 'string'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/word-ladder/', youtubeUrl: 'https://www.youtube.com/results?search_query=word+ladder', articleUrl: '', companies: ['Amazon', 'Meta', 'Google'], order: 5 },
  ],
  'dynamic-programming': [
    { slug: 'climbing-stairs', title: 'Climbing Stairs', difficulty: 'easy', tags: ['dynamic-programming', 'math'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/climbing-stairs/', youtubeUrl: 'https://www.youtube.com/results?search_query=climbing+stairs', articleUrl: '', companies: ['Amazon', 'Google', 'Apple'], order: 1 },
    { slug: 'house-robber', title: 'House Robber', difficulty: 'medium', tags: ['dynamic-programming'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/house-robber/', youtubeUrl: 'https://www.youtube.com/results?search_query=house+robber', articleUrl: '', companies: ['Amazon', 'Google', 'Microsoft'], order: 2 },
    { slug: 'coin-change', title: 'Coin Change', difficulty: 'medium', tags: ['dynamic-programming', 'bfs'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/coin-change/', youtubeUrl: 'https://www.youtube.com/results?search_query=coin+change', articleUrl: '', companies: ['Amazon', 'Google', 'Goldman Sachs'], order: 3 },
    { slug: 'longest-increasing-subsequence', title: 'Longest Increasing Subsequence', difficulty: 'medium', tags: ['dynamic-programming', 'binary-search'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/longest-increasing-subsequence/', youtubeUrl: 'https://www.youtube.com/results?search_query=longest+increasing+subsequence', articleUrl: '', companies: ['Amazon', 'Microsoft', 'Google'], order: 4 },
    { slug: 'longest-common-subsequence', title: 'Longest Common Subsequence', difficulty: 'medium', tags: ['dynamic-programming', 'string'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/longest-common-subsequence/', youtubeUrl: 'https://www.youtube.com/results?search_query=longest+common+subsequence', articleUrl: '', companies: ['Amazon', 'Google'], order: 5 },
    { slug: 'edit-distance', title: 'Edit Distance', difficulty: 'medium', tags: ['dynamic-programming', 'string'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/edit-distance/', youtubeUrl: 'https://www.youtube.com/results?search_query=edit+distance', articleUrl: '', companies: ['Amazon', 'Google', 'Microsoft'], order: 6 },
  ],
  'binary-search': [
    { slug: 'binary-search', title: 'Binary Search', difficulty: 'easy', tags: ['binary-search', 'array'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/binary-search/', youtubeUrl: 'https://www.youtube.com/results?search_query=binary+search+leetcode', articleUrl: '', companies: ['Amazon', 'Microsoft'], order: 1 },
    { slug: 'search-in-rotated-sorted-array', title: 'Search in Rotated Sorted Array', difficulty: 'medium', tags: ['binary-search', 'array'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', youtubeUrl: 'https://www.youtube.com/results?search_query=search+in+rotated+sorted+array', articleUrl: 'https://takeuforward.org/data-structure/search-element-in-a-rotated-sorted-array/', companies: ['Amazon', 'Meta', 'Microsoft'], order: 2 },
    { slug: 'find-minimum-in-rotated-sorted-array', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'medium', tags: ['binary-search', 'array'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', youtubeUrl: 'https://www.youtube.com/results?search_query=find+minimum+in+rotated+sorted+array', articleUrl: '', companies: ['Amazon', 'Goldman Sachs', 'Google'], order: 3 },
    { slug: 'koko-eating-bananas', title: 'Koko Eating Bananas', difficulty: 'medium', tags: ['binary-search'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/koko-eating-bananas/', youtubeUrl: 'https://www.youtube.com/results?search_query=koko+eating+bananas', articleUrl: '', companies: ['Google', 'Amazon'], order: 4 },
    { slug: 'median-of-two-sorted-arrays', title: 'Median of Two Sorted Arrays', difficulty: 'hard', tags: ['binary-search', 'array', 'divide-and-conquer'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', youtubeUrl: 'https://www.youtube.com/results?search_query=median+of+two+sorted+arrays', articleUrl: '', companies: ['Amazon', 'Google', 'Apple'], order: 5 },
  ],
  greedy: [
    { slug: 'maximum-subarray', title: 'Maximum Subarray', difficulty: 'medium', tags: ['greedy', 'dynamic-programming', 'divide-and-conquer'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/maximum-subarray/', youtubeUrl: 'https://www.youtube.com/results?search_query=maximum+subarray', articleUrl: '', companies: ['Amazon', 'Google', 'Microsoft'], order: 1 },
    { slug: 'jump-game', title: 'Jump Game', difficulty: 'medium', tags: ['greedy', 'dynamic-programming'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/jump-game/', youtubeUrl: 'https://www.youtube.com/results?search_query=jump+game', articleUrl: '', companies: ['Amazon', 'Microsoft'], order: 2 },
    { slug: 'jump-game-ii', title: 'Jump Game II', difficulty: 'medium', tags: ['greedy', 'dynamic-programming'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/jump-game-ii/', youtubeUrl: 'https://www.youtube.com/results?search_query=jump+game+ii', articleUrl: '', companies: ['Amazon', 'Google'], order: 3 },
    { slug: 'gas-station', title: 'Gas Station', difficulty: 'medium', tags: ['greedy', 'array'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/gas-station/', youtubeUrl: 'https://www.youtube.com/results?search_query=gas+station', articleUrl: '', companies: ['Amazon', 'Bloomberg'], order: 4 },
    { slug: 'task-scheduler', title: 'Task Scheduler', difficulty: 'medium', tags: ['greedy', 'hash-table', 'sorting'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/task-scheduler/', youtubeUrl: 'https://www.youtube.com/results?search_query=task+scheduler', articleUrl: '', companies: ['Meta', 'Amazon', 'Google'], order: 5 },
  ],
  backtracking: [
    { slug: 'subsets', title: 'Subsets', difficulty: 'medium', tags: ['backtracking', 'array', 'bit-manipulation'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/subsets/', youtubeUrl: 'https://www.youtube.com/results?search_query=subsets+leetcode', articleUrl: '', companies: ['Amazon', 'Meta', 'Google'], order: 1 },
    { slug: 'combination-sum', title: 'Combination Sum', difficulty: 'medium', tags: ['backtracking', 'array'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/combination-sum/', youtubeUrl: 'https://www.youtube.com/results?search_query=combination+sum', articleUrl: '', companies: ['Amazon', 'Apple'], order: 2 },
    { slug: 'permutations', title: 'Permutations', difficulty: 'medium', tags: ['backtracking', 'array'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/permutations/', youtubeUrl: 'https://www.youtube.com/results?search_query=permutations+leetcode', articleUrl: '', companies: ['Amazon', 'Meta', 'Microsoft'], order: 3 },
    { slug: 'word-search', title: 'Word Search', difficulty: 'medium', tags: ['backtracking', 'matrix'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/word-search/', youtubeUrl: 'https://www.youtube.com/results?search_query=word+search+leetcode', articleUrl: '', companies: ['Amazon', 'Microsoft', 'Bloomberg'], order: 4 },
    { slug: 'n-queens', title: 'N-Queens', difficulty: 'hard', tags: ['backtracking'], platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/n-queens/', youtubeUrl: 'https://www.youtube.com/results?search_query=n+queens', articleUrl: '', companies: ['Amazon', 'Google', 'Microsoft'], order: 5 },
  ],
};

/**
 * Seeds the database with topics and problems.
 * Drops existing data, inserts topics, inserts problems, and updates topic counts.
 */
async function seed(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Drop existing collections
    logger.info('Dropping existing topics and problems collections...');
    await Topic.deleteMany({});
    await Problem.deleteMany({});
    logger.info('Existing data dropped');

    // Insert topics
    const insertedTopics = await Topic.insertMany(topicsSeed);
    logger.info(`Inserted ${insertedTopics.length} topics`);

    // Build a slug-to-ID map
    const topicSlugToId = new Map<string, mongoose.Types.ObjectId>();
    for (const topic of insertedTopics) {
      topicSlugToId.set(topic.slug, topic._id as mongoose.Types.ObjectId);
    }

    // Insert problems for each topic
    let totalProblems = 0;
    for (const [topicSlug, problems] of Object.entries(problemsSeed)) {
      const topicId = topicSlugToId.get(topicSlug);
      if (!topicId) {
        logger.warn(`Topic slug '${topicSlug}' not found, skipping its problems`);
        continue;
      }

      const problemDocs = problems.map((problem) => ({
        ...problem,
        topicId,
      }));

      await Problem.insertMany(problemDocs);
      totalProblems += problemDocs.length;

      // Update the topic's totalProblems count
      await Topic.findByIdAndUpdate(topicId, { totalProblems: problemDocs.length });
    }

    logger.info(`Seeded ${insertedTopics.length} topics and ${totalProblems} problems`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Seed script failed', { error: message });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

seed();

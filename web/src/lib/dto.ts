import { z } from 'zod';

// DTO for Schedule Facebook Post API
export const ScheduleFbPostDto = z.object({
  postId: z.number({ error: 'Post ID is required and must be a number' }),
  scheduledTime: z.iso.datetime({ error: 'Invalid ISO 8601 datetime format' }),
  rewrittenText: z.string().optional(),
});

export type ScheduleFbPostDtoType = z.infer<typeof ScheduleFbPostDto>;

// DTO for Update Post API
export const UpdatePostDto = z.object({
  rewrittenText: z.string().min(1, 'Text cannot be empty'),
});

export type UpdatePostDtoType = z.infer<typeof UpdatePostDto>;

// DTO for Auto Queue Post API
export const AutoQueuePostDto = z.object({
  postId: z.number({ error: 'Post ID is required and must be a number' }),
  rewrittenText: z.string().optional(),
});

export type AutoQueuePostDtoType = z.infer<typeof AutoQueuePostDto>;

// DTO for Create Post API
export const CreatePostDto = z.object({
  originalText: z.string().min(1, 'Original text is required'),
  rewrittenText: z.string().optional(),
});

export type CreatePostDtoType = z.infer<typeof CreatePostDto>;

// DTO for Auto Config API
export const UpdateAutoConfigDto = z.object({
  autoScrapeOn: z.boolean().optional(),
  autoPostOn: z.boolean().optional(),
  postIntervalMin: z.number().min(1).optional(),
  scrapeIntervalMin: z.number().min(1).optional(),
  aiPromptRules: z.string().optional(),
});

export type UpdateAutoConfigDtoType = z.infer<typeof UpdateAutoConfigDto>;

// DTO for Create Source API
export const CreateSourceDto = z.object({
  url: z.url('Must be a valid URL'),
  name: z.string().min(1, 'Name is required'),
  interval: z.number().min(1).default(30),
});

export type CreateSourceDtoType = z.infer<typeof CreateSourceDto>;

// DTO for Update Source API
export const UpdateSourceDto = z.object({
  url: z.url('Must be a valid URL').optional(),
  name: z.string().min(1, 'Name cannot be empty').optional(),
  interval: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSourceDtoType = z.infer<typeof UpdateSourceDto>;

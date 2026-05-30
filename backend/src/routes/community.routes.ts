import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  getComments,
  getPost,
  getPosts,
  toggleReaction,
  updateComment,
  updatePost,
} from '../services/community.service';

const router = Router();

const postTypeSchema = z.enum(['discussion', 'help_request', 'safety_tip', 'report']);
const reactionTypeSchema = z.enum(['like', 'heart', 'sos', 'strong']);

const listQuerySchema = z.object({
  crisisId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const createPostSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  type: postTypeSchema.default('discussion'),
  username: z.string().trim().min(2).max(40),
  crisisId: z.string().trim().min(1).optional(),
  location: z.string().trim().max(120).optional(),
  imageUrl: z.string().trim().url().or(z.literal('')).optional(),
});

const updatePostSchema = z.object({
  content: z.string().trim().min(1).max(2000).optional(),
  type: postTypeSchema.optional(),
  location: z.string().trim().max(120).optional(),
  imageUrl: z.string().trim().url().or(z.literal('')).optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

const commentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  username: z.string().trim().min(2).max(40),
});

const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

const reactionSchema = z.object({
  username: z.string().trim().min(2).max(40),
  type: reactionTypeSchema,
});

function sendError(res: Response, err: unknown) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: 'Validation failed', issues: err.issues });
  }
  return res.status(500).json({ error: String(err) });
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { crisisId, limit } = listQuerySchema.parse(req.query);
    const posts = await getPosts(crisisId, limit);
    res.json(posts);
  } catch (err) { sendError(res, err); }
});

router.get('/:postId', async (req: Request, res: Response) => {
  try {
    const post = await getPost(String(req.params.postId));
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) { sendError(res, err); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = createPostSchema.parse(req.body);
    const post = await createPost(payload);
    res.status(201).json(post);
  } catch (err) { sendError(res, err); }
});

router.patch('/:postId', async (req: Request, res: Response) => {
  try {
    const payload = updatePostSchema.parse(req.body);
    const post = await updatePost(String(req.params.postId), payload);
    res.json(post);
  } catch (err) { sendError(res, err); }
});

router.delete('/:postId', async (req: Request, res: Response) => {
  try {
    const result = await deletePost(String(req.params.postId));
    res.json(result);
  } catch (err) { sendError(res, err); }
});

router.get('/:postId/comments', async (req: Request, res: Response) => {
  try {
    const comments = await getComments(String(req.params.postId));
    res.json(comments);
  } catch (err) { sendError(res, err); }
});

router.post('/:postId/comments', async (req: Request, res: Response) => {
  try {
    const payload = commentSchema.parse(req.body);
    const comment = await addComment(String(req.params.postId), payload.content, payload.username);
    res.status(201).json(comment);
  } catch (err) { sendError(res, err); }
});

router.patch('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const payload = updateCommentSchema.parse(req.body);
    const comment = await updateComment(String(req.params.commentId), payload.content);
    res.json(comment);
  } catch (err) { sendError(res, err); }
});

router.delete('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const result = await deleteComment(String(req.params.commentId));
    res.json(result);
  } catch (err) { sendError(res, err); }
});

router.post('/:postId/reactions', async (req: Request, res: Response) => {
  try {
    const payload = reactionSchema.parse(req.body);
    const result = await toggleReaction(String(req.params.postId), payload.username, payload.type);
    res.json(result);
  } catch (err) { sendError(res, err); }
});

export default router;

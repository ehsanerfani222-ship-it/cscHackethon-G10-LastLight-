import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createChatRoom,
  createMessage,
  deleteChatRoom,
  deleteMessage,
  getChatRoom,
  getChatRooms,
  getMessages,
  updateChatRoom,
  updateMessage,
} from '../services/chat.service';

const router = Router();

const listRoomsSchema = z.object({
  crisisId: z.string().optional(),
});

const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).optional(),
  crisisId: z.string().trim().min(1).optional(),
  username: z.string().trim().min(2).max(40),
});

const updateRoomSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(240).optional(),
  crisisId: z.string().trim().min(1).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

const messageSchema = z.object({
  content: z.string().trim().min(1).max(1200),
  username: z.string().trim().min(2).max(40),
});

const updateMessageSchema = z.object({
  content: z.string().trim().min(1).max(1200),
});

const listMessagesSchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
});

function sendError(res: Response, err: unknown) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: 'Validation failed', issues: err.issues });
  }
  return res.status(500).json({ error: String(err) });
}

router.get('/rooms', async (req: Request, res: Response) => {
  try {
    const { crisisId } = listRoomsSchema.parse(req.query);
    const rooms = await getChatRooms(crisisId);
    res.json(rooms);
  } catch (err) { sendError(res, err); }
});

router.post('/rooms', async (req: Request, res: Response) => {
  try {
    const payload = createRoomSchema.parse(req.body);
    const room = await createChatRoom(payload);
    res.status(201).json(room);
  } catch (err) { sendError(res, err); }
});

router.get('/rooms/:roomId', async (req: Request, res: Response) => {
  try {
    const room = await getChatRoom(String(req.params.roomId));
    if (!room) return res.status(404).json({ error: 'Chat room not found' });
    res.json(room);
  } catch (err) { sendError(res, err); }
});

router.patch('/rooms/:roomId', async (req: Request, res: Response) => {
  try {
    const payload = updateRoomSchema.parse(req.body);
    const room = await updateChatRoom(String(req.params.roomId), payload);
    res.json(room);
  } catch (err) { sendError(res, err); }
});

router.delete('/rooms/:roomId', async (req: Request, res: Response) => {
  try {
    const result = await deleteChatRoom(String(req.params.roomId));
    res.json(result);
  } catch (err) { sendError(res, err); }
});

router.get('/rooms/:roomId/messages', async (req: Request, res: Response) => {
  try {
    const { limit } = listMessagesSchema.parse(req.query);
    const messages = await getMessages(String(req.params.roomId), limit);
    res.json(messages);
  } catch (err) { sendError(res, err); }
});

router.post('/rooms/:roomId/messages', async (req: Request, res: Response) => {
  try {
    const payload = messageSchema.parse(req.body);
    const message = await createMessage(String(req.params.roomId), payload.content, payload.username);
    res.status(201).json(message);
  } catch (err) { sendError(res, err); }
});

router.patch('/messages/:messageId', async (req: Request, res: Response) => {
  try {
    const payload = updateMessageSchema.parse(req.body);
    const message = await updateMessage(String(req.params.messageId), payload.content);
    res.json(message);
  } catch (err) { sendError(res, err); }
});

router.delete('/messages/:messageId', async (req: Request, res: Response) => {
  try {
    const result = await deleteMessage(String(req.params.messageId));
    res.json(result);
  } catch (err) { sendError(res, err); }
});

export default router;

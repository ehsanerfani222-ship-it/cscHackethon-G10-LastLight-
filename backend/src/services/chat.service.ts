import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { getOrCreateUser } from './community.service';

const adapter = new PrismaLibSql({ url: `file:${path.join(process.cwd(), 'lastlight.db')}` });
const prisma = new PrismaClient({ adapter });

const roomInclude = {
  crisis: true,
  messages: {
    include: { sender: true },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
  _count: { select: { messages: true } },
};

export async function getChatRooms(crisisId?: string) {
  return prisma.chatRoom.findMany({
    where: crisisId ? { crisisId } : {},
    include: roomInclude,
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getChatRoom(roomId: string) {
  return prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      crisis: true,
      messages: { include: { sender: true }, orderBy: { createdAt: 'asc' }, take: 50 },
      _count: { select: { messages: true } },
    },
  });
}

export async function createChatRoom(data: {
  name: string;
  description?: string;
  crisisId?: string;
  username: string;
}) {
  const user = await getOrCreateUser(data.username);
  return prisma.chatRoom.create({
    data: {
      name: data.name,
      description: data.description ?? '',
      crisisId: data.crisisId,
      createdBy: user.username,
    },
    include: roomInclude,
  });
}

export async function updateChatRoom(roomId: string, data: {
  name?: string;
  description?: string;
  crisisId?: string | null;
}) {
  return prisma.chatRoom.update({
    where: { id: roomId },
    data,
    include: roomInclude,
  });
}

export async function deleteChatRoom(roomId: string) {
  await prisma.chatRoom.delete({ where: { id: roomId } });
  return { deleted: true };
}

export async function getMessages(roomId: string, limit = 50) {
  return prisma.chatMessage.findMany({
    where: { roomId },
    include: { sender: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

export async function createMessage(roomId: string, content: string, username: string) {
  const sender = await getOrCreateUser(username);
  const message = await prisma.chatMessage.create({
    data: { roomId, content, senderId: sender.id },
    include: { sender: true },
  });
  await prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } });
  return message;
}

export async function updateMessage(messageId: string, content: string) {
  return prisma.chatMessage.update({
    where: { id: messageId },
    data: { content },
    include: { sender: true },
  });
}

export async function deleteMessage(messageId: string) {
  await prisma.chatMessage.delete({ where: { id: messageId } });
  return { deleted: true };
}

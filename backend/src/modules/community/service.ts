import { prisma } from '../../lib/prisma';

export async function getOrCreateUser(username: string) {
  const normalized = username.trim();
  return prisma.user.upsert({
    where: { username: normalized },
    update: {},
    create: { username: normalized, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalized)}` },
  });
}

export async function getPosts(crisisId?: string, limit = 30) {
  return prisma.post.findMany({
    where: crisisId ? { crisisId } : {},
    include: {
      author: true,
      comments: { include: { author: true }, orderBy: { createdAt: 'asc' }, take: 5 },
      reactions: { include: { user: true } },
      _count: { select: { comments: true, reactions: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getPost(postId: string) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      reactions: { include: { user: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });
}

export async function createPost(data: {
  content: string;
  type: string;
  username: string;
  crisisId?: string;
  location?: string;
  imageUrl?: string;
}) {
  const user = await getOrCreateUser(data.username);
  return prisma.post.create({
    data: {
      content: data.content,
      type: data.type,
      authorId: user.id,
      crisisId: data.crisisId,
      location: data.location ?? '',
      imageUrl: data.imageUrl ?? '',
    },
    include: {
      author: true,
      comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      reactions: { include: { user: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });
}

export async function updatePost(postId: string, data: {
  content?: string;
  type?: string;
  location?: string;
  imageUrl?: string;
}) {
  return prisma.post.update({
    where: { id: postId },
    data,
    include: {
      author: true,
      comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      reactions: { include: { user: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });
}

export async function deletePost(postId: string) {
  await prisma.post.delete({ where: { id: postId } });
  return { deleted: true };
}

export async function getComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addComment(postId: string, content: string, username: string) {
  const user = await getOrCreateUser(username);
  return prisma.comment.create({
    data: { postId, content, authorId: user.id },
    include: { author: true },
  });
}

export async function updateComment(commentId: string, content: string) {
  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: { author: true },
  });
}

export async function deleteComment(commentId: string) {
  await prisma.comment.delete({ where: { id: commentId } });
  return { deleted: true };
}

export async function toggleReaction(postId: string, username: string, type: string) {
  const user = await getOrCreateUser(username);
  const existing = await prisma.reaction.findUnique({
    where: { postId_userId_type: { postId, userId: user.id, type } },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return { action: 'removed' };
  }
  await prisma.reaction.create({ data: { postId, userId: user.id, type } });
  return { action: 'added' };
}

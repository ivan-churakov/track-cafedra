import type { NextApiRequest, NextApiResponse } from 'next';
import { decodeMockToken } from '../../../lib/mock-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Unauthorized' });

  const token = auth.replace(/^Bearer\s+/, '');
  const payload = decodeMockToken(token);
  if (!payload) return res.status(401).json({ message: 'Invalid token' });

  return res.status(200).json({
    username: payload.sub,
    role: payload.role,
    teacher_id: payload.teacher_id,
    teacher_full_name: payload.teacher_full_name,
  });
}

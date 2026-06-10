import type { NextApiRequest, NextApiResponse } from 'next';
import { getMockSchedule } from '../../../../lib/mock-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const teacherId = Number(req.query.id);
  return res.status(200).json({ events: getMockSchedule(teacherId) });
}

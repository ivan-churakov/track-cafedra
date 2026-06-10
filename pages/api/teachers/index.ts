import type { NextApiRequest, NextApiResponse } from 'next';
import { getMockTeachers } from '../../../lib/mock-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ teachers: getMockTeachers() });
  }

  if (req.method === 'POST') {
    const teachers = getMockTeachers();
    const newId = Math.max(...teachers.map(t => t.id), 0) + 1;
    const created = { id: newId, ...req.body };
    return res.status(201).json(created);
  }

  return res.status(405).end();
}

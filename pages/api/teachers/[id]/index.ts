import type { NextApiRequest, NextApiResponse } from 'next';
import { getMockTeachers } from '../../../../lib/mock-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  const teachers = getMockTeachers();
  const teacher = teachers.find(t => t.id === id);

  if (req.method === 'GET') {
    if (!teacher) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json(teacher);
  }

  if (req.method === 'PUT') {
    const updated = { id, ...req.body, full_name: [req.body.last_name, req.body.first_name, req.body.middle_name].filter(Boolean).join(' ') };
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    return res.status(204).end();
  }

  return res.status(405).end();
}

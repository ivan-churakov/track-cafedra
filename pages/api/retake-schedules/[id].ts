import type { NextApiRequest, NextApiResponse } from 'next';
import { getMockRetakes } from '../../../lib/mock-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);

  if (req.method === 'GET') {
    const all = getMockRetakes();
    const item = all.find(r => r.id === id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json(item);
  }

  if (req.method === 'PUT') {
    return res.status(200).json({ id, ...req.body });
  }

  if (req.method === 'DELETE') {
    return res.status(204).end();
  }

  return res.status(405).end();
}

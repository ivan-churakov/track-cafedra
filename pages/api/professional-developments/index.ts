import type { NextApiRequest, NextApiResponse } from 'next';
import { getMockKpk } from '../../../lib/mock-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const teacherId = req.query.teacherId ? Number(req.query.teacherId) : undefined;
    return res.status(200).json({ professional_developments: getMockKpk(teacherId) });
  }

  if (req.method === 'POST') {
    const created = { id: Date.now(), scan_download_url: null, ...req.body };
    return res.status(201).json(created);
  }

  return res.status(405).end();
}

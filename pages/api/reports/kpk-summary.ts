import type { NextApiRequest, NextApiResponse } from 'next';
import { getMockKpk } from '../../../lib/mock-data';
import type { KpkSummary } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const items = getMockKpk();
  const now = new Date().toISOString();
  const totalHours = items.reduce((s, k) => s + (k.hours ?? 0), 0);

  const summary: KpkSummary = {
    generated_at: now,
    period_from: new Date().getFullYear() + '-01-01',
    period_to: new Date().getFullYear() + '-12-31',
    summary: {
      total_records: items.length,
      total_hours: totalHours,
    },
    items,
  };

  return res.status(200).json(summary);
}

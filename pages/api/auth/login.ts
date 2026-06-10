import type { NextApiRequest, NextApiResponse } from 'next';
import { makeMockToken, getMockTeachers } from '../../../lib/mock-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { login, password } = req.body ?? {};
  if (!login || !password) return res.status(400).json({ message: 'login and password required' });

  const teachers = getMockTeachers();
  const teacher = teachers.find(t => t.email.toLowerCase() === String(login).toLowerCase());

  if (teacher) {
    const token = makeMockToken({
      sub: teacher.email,
      role: 'TEACHER',
      teacher_id: teacher.id,
      teacher_full_name: teacher.full_name,
    });
    return res.status(200).json({
      access_token: token,
      token_type: 'Bearer',
      role: 'TEACHER',
      teacher_id: teacher.id,
      teacher_full_name: teacher.full_name,
    });
  }

  // Anything else → ADMIN
  const token = makeMockToken({ sub: String(login), role: 'ADMIN' });
  return res.status(200).json({
    access_token: token,
    token_type: 'Bearer',
    role: 'ADMIN',
  });
}

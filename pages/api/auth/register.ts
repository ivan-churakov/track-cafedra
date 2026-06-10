import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });
  if (password.length < 8) return res.status(400).json({ message: 'Пароль должен содержать минимум 8 символов' });

  return res.status(201).json({
    message: 'Письмо со ссылкой подтверждения отправлено',
    email,
  });
}

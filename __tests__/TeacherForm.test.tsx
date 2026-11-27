import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TeacherForm } from '../pages/admin';

jest.mock('../lib/api', () => ({ directories: {
  positions: () => Promise.resolve({ positions: [{ id: 1, name: 'Доцент' }] }),
  academicTitles: () => Promise.resolve({ academic_titles: [] }),
  academicDegrees: () => Promise.resolve({ academic_degrees: [{ short_name: 'к.т.н.', full_name: 'Кандидат технических наук' }] }),
} }));

test('admin can submit a teacher without academic degrees, titles, Telegram or schedule', async () => {
  const onSave = jest.fn();
  const { container } = render(<TeacherForm onSave={onSave} onClose={() => {}} saving={false} error="" />);
  await screen.findByRole('option', { name: 'Доцент' });
  fireEvent.change(screen.getByPlaceholderText('Иванов'), { target: { value: 'Иванов' } });
  fireEvent.change(screen.getByPlaceholderText('Иван'), { target: { value: 'Иван' } });
  fireEvent.change(screen.getByPlaceholderText('Иванович'), { target: { value: 'Иванович' } });
  fireEvent.change(screen.getByPlaceholderText('ivanov@mirea.ru'), { target: { value: 'test@edu.mirea.ru' } });
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Доцент' } });
  fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2020-09-01' } });
  expect(screen.getByPlaceholderText('@username')).not.toBeRequired();
  expect(screen.getByPlaceholderText('webcal://...')).not.toBeRequired();
  fireEvent.submit(container.querySelector('form')!);
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ academic_degrees: [], academic_titles: [], tg_username: '', schedule_url: '' }));
  onSave.mockClear();
  fireEvent.change(screen.getByPlaceholderText('Иванов'), { target: { value: '' } });
  fireEvent.submit(container.querySelector('form')!);
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByText('Заполните обязательные поля, отмеченные звёздочкой')).toBeInTheDocument();
});

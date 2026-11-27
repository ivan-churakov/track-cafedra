import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import RKBPPage from '../pages/new-track';
import TVPPage from '../pages/new-track2';
import { curriculumEntries, ApiError } from '../lib/api';

jest.mock('../hooks/useAuth', () => ({ useAuth: () => ({ isAdmin: true }) }));
jest.mock('../lib/api', () => ({
  ApiError: jest.requireActual('../lib/api').ApiError,
  curriculumEntries: { list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  directories: { subjects: () => Promise.resolve({ subjects: [
    { id: 1, name: 'Новая дисциплина' }, { id: 2, name: 'Updated' },
    { id: 3, name: 'Subject 0' }, { id: 4, name: 'Subject 1' },
  ] }) },
}));
jest.mock('../Components/SVGTrack/NewTrack', () => ({
  Track: ({ variant, entries, onAdd, onEdit, onReorder }: any) => <div>
    <span>variant {variant}</span>
    <button onClick={onAdd}>add</button>
    {entries.length > 0 && <>
      <button onClick={() => onEdit(entries[0])}>edit</button>
      <button onClick={() => onReorder('red', [entries[1].id, entries[0].id])}>reorder</button>
    </>}
  </div>,
}));

describe.each([
  { Page: RKBPPage, planId: Number(process.env.NEXT_PUBLIC_STUDY_PLAN_ID_1 ?? 1), variant: '1' },
  { Page: TVPPage, planId: Number(process.env.NEXT_PUBLIC_STUDY_PLAN_ID_2 ?? 2), variant: '2' },
])('track editor variant $variant', ({ Page, planId, variant }) => {
  beforeEach(() => jest.clearAllMocks());

  test('loads and creates disciplines in its own study plan', async () => {
    (curriculumEntries.list as jest.Mock).mockResolvedValue({ curriculum_entries: [] });
    (curriculumEntries.create as jest.Mock).mockResolvedValue({});
    render(<Page />);
    await waitFor(() => expect(curriculumEntries.list).toHaveBeenCalledWith(planId));
    expect(screen.getByText(`variant ${variant}`)).toBeInTheDocument();
    fireEvent.click(screen.getByText('add'));
    fireEvent.change(screen.getByPlaceholderText('Введите название предмета'), { target: { value: 'Новая дисциплина' } });
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => expect(curriculumEntries.create).toHaveBeenCalledWith(expect.objectContaining({
      study_plan_id: planId, name: 'Новая дисциплина', track_color: 'red', track_position: 0,
    })));
    await waitFor(() => expect(screen.queryByText('Добавить дисциплину')).not.toBeInTheDocument());
  });

  test('edits, reorders and deletes only loaded disciplines', async () => {
    const entries = [0, 1].map(index => ({ id: planId * 100 + index, name: `Subject ${index}`,
      study_plan_id: planId, track_color: 'red', track_position: index, semesters: [1] }));
    (curriculumEntries.list as jest.Mock).mockResolvedValue({ curriculum_entries: entries });
    (curriculumEntries.update as jest.Mock).mockResolvedValue({});
    (curriculumEntries.delete as jest.Mock).mockResolvedValue({});
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Page />);
    fireEvent.click(await screen.findByText('reorder'));
    await waitFor(() => expect(curriculumEntries.update).toHaveBeenCalledTimes(2));
    expect(curriculumEntries.update).toHaveBeenCalledWith(entries[1].id, expect.objectContaining({ study_plan_id: planId, track_position: 0 }));
    expect(curriculumEntries.update).toHaveBeenCalledWith(entries[0].id, expect.objectContaining({ study_plan_id: planId, track_position: 1 }));
    fireEvent.click(screen.getByText('edit'));
    fireEvent.change(screen.getByPlaceholderText('Введите название предмета'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => expect(curriculumEntries.update).toHaveBeenCalledWith(entries[0].id, expect.objectContaining({ study_plan_id: planId, name: 'Updated' })));
    await waitFor(() => expect(screen.queryByText('Редактировать дисциплину')).not.toBeInTheDocument());
    fireEvent.click(screen.getByText('edit'));
    fireEvent.click(screen.getByText('Удалить'));
    await waitFor(() => expect(curriculumEntries.delete).toHaveBeenCalledWith(entries[0].id));
    await waitFor(() => expect(screen.queryByText('Редактировать дисциплину')).not.toBeInTheDocument());
    jest.restoreAllMocks();
  });

  test('blocks empty and duplicate subjects before sending a request', async () => {
    (curriculumEntries.list as jest.Mock).mockResolvedValue({ curriculum_entries: [
      { id: planId * 100, name: 'Subject 0', study_plan_id: planId, track_color: 'red', track_position: 0 },
    ] });
    render(<Page />);
    await screen.findByText('edit');
    fireEvent.click(screen.getByText('add'));
    const name = screen.getByPlaceholderText('Введите название предмета');
    fireEvent.change(name, { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Сохранить'));
    expect(screen.getByText('Сохранить')).toBeDisabled();
    expect(curriculumEntries.create).not.toHaveBeenCalled();
    fireEvent.change(name, { target: { value: 'Subject 0' } });
    fireEvent.click(screen.getByText('Сохранить'));
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent('уже есть');
    expect(curriculumEntries.create).not.toHaveBeenCalled();
  });

  test('accepts a new subject name and trims it', async () => {
    (curriculumEntries.list as jest.Mock).mockResolvedValue({ curriculum_entries: [] });
    (curriculumEntries.create as jest.Mock).mockResolvedValue({});
    render(<Page />);
    await waitFor(() => expect(curriculumEntries.list).toHaveBeenCalledWith(planId));
    fireEvent.click(screen.getByText('add'));
    fireEvent.change(screen.getByPlaceholderText('Введите название предмета'), { target: { value: '  Основы  ' } });
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => expect(curriculumEntries.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Основы', study_plan_id: planId })));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('shows API errors inside the open modal and preserves entered values', async () => {
    (curriculumEntries.list as jest.Mock).mockResolvedValue({ curriculum_entries: [] });
    (curriculumEntries.create as jest.Mock).mockRejectedValueOnce(new ApiError(400, 'Bad Request'));
    render(<Page />);
    await waitFor(() => expect(curriculumEntries.list).toHaveBeenCalledWith(planId));
    fireEvent.click(screen.getByText('add'));
    fireEvent.change(screen.getByPlaceholderText('Введите название предмета'), { target: { value: '  новая дисциплина  ' } });
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent('Проверьте выбранный предмет'));
    expect(curriculumEntries.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Новая дисциплина', study_plan_id: planId }));
    expect(screen.getByPlaceholderText('Введите название предмета')).toHaveValue('  новая дисциплина  ');
  });
});

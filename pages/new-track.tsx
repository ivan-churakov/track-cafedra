import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Track } from "../Components/SVGTrack/NewTrack";
import { curriculumEntries, directories, ApiError } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import type { CurriculumEntry, Subject } from "../types";

const STUDY_PLAN_ID = Number(process.env.NEXT_PUBLIC_STUDY_PLAN_ID_1 ?? 1);
const TRACK_COLORS = ["red", "green", "blue", "orange"] as const;
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

type Payload = Omit<CurriculumEntry, "id">;

/** Тело запроса из записи плана — для переупорядочивания и предзаполнения. */
function toPayload(e: CurriculumEntry): Payload {
  return {
    name: e.name,
    study_plan_id: e.study_plan_id,
    track_color: e.track_color,
    track_position: e.track_position,
    semesters: e.semesters ?? [],
    exam_semesters: e.exam_semesters ?? [],
    credit_semesters: e.credit_semesters ?? [],
    credit_units: e.credit_units,
    lecture_hours: e.lecture_hours,
    practice_hours: e.practice_hours,
  };
}

const NewTrackPage = () => {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState<CurriculumEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [editing, setEditing] = useState<CurriculumEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await curriculumEntries.list(STUDY_PLAN_ID);
    setEntries(res.curriculum_entries);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e?.message ?? "Не удалось загрузить учебный план"));
  }, [load]);

  useEffect(() => {
    directories.subjects().then((r) => setSubjects(r.subjects)).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (entry: CurriculumEntry) => {
    setEditing(entry);
    setModalOpen(true);
  };

  const handleSave = async (payload: Payload) => {
    try {
      if (editing) await curriculumEntries.update(editing.id, payload);
      else await curriculumEntries.create(payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить");
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!window.confirm(`Удалить дисциплину «${editing.name}»?`)) return;
    try {
      await curriculumEntries.delete(editing.id);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось удалить");
    }
  };

  const handleReorder = async (color: string, orderedIds: number[]) => {
    const updates = orderedIds
      .map((id, idx) => ({ entry: entries.find((e) => e.id === id), idx }))
      .filter(({ entry, idx }) => entry && entry.track_position !== idx) as {
      entry: CurriculumEntry;
      idx: number;
    }[];
    if (updates.length === 0) return;
    try {
      await Promise.all(
        updates.map(({ entry, idx }) =>
          curriculumEntries.update(entry.id, { ...toPayload(entry), track_position: idx })
        )
      );
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить порядок");
      await load();
    }
  };

  return (
    <div className="relative w-full h-full bg-white">
      {error && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-30 bg-red-100 text-red-800 px-4 py-2 rounded shadow">
          {error}
          <button className="ml-3 font-bold" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
      <Track
        variant="1"
        entries={entries}
        isAdmin={isAdmin}
        onAdd={openAdd}
        onEdit={openEdit}
        onReorder={handleReorder}
      />
      {modalOpen && (
        <DisciplineModal
          editing={editing}
          subjects={subjects}
          existing={entries}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

// ── Модалка добавления / редактирования ───────────────────────────────────────

const DisciplineModal = ({
  editing,
  subjects,
  existing,
  onSave,
  onDelete,
  onClose,
}: {
  editing: CurriculumEntry | null;
  subjects: Subject[];
  existing: CurriculumEntry[];
  onSave: (payload: Payload) => void;
  onDelete?: () => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(editing?.name ?? "");
  const [trackColor, setTrackColor] = useState(editing?.track_color ?? "red");
  const [semesters, setSemesters] = useState<number[]>(editing?.semesters ?? []);
  const [examSemesters, setExamSemesters] = useState<number[]>(editing?.exam_semesters ?? []);
  const [creditSemesters, setCreditSemesters] = useState<number[]>(editing?.credit_semesters ?? []);
  const [creditUnits, setCreditUnits] = useState<string>(editing?.credit_units?.toString() ?? "");
  const [lectureHours, setLectureHours] = useState<string>(editing?.lecture_hours?.toString() ?? "");
  const [practiceHours, setPracticeHours] = useState<string>(editing?.practice_hours?.toString() ?? "");

  // Позиция новой дисциплины — в конец выбранного трека.
  const nextPosition = useMemo(() => {
    const inTrack = existing.filter((e) => e.track_color === trackColor && e.id !== editing?.id);
    return inTrack.length === 0 ? 0 : Math.max(...inTrack.map((e) => e.track_position ?? 0)) + 1;
  }, [existing, trackColor, editing]);

  const toggle = (value: number, list: number[], set: (v: number[]) => void) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value].sort((a, b) => a - b));
  };

  const submit = () => {
    if (!name.trim()) return;
    // Цвет трека сменился — позиция старого трека невалидна, кладём в конец нового.
    const colorChanged = editing != null && editing.track_color !== trackColor;
    const position = editing && !colorChanged ? editing.track_position : nextPosition;
    onSave({
      name: name.trim(),
      study_plan_id: STUDY_PLAN_ID,
      track_color: trackColor,
      track_position: position,
      semesters,
      exam_semesters: examSemesters,
      credit_semesters: creditSemesters,
      credit_units: creditUnits === "" ? (undefined as unknown as number) : Number(creditUnits),
      lecture_hours: lectureHours === "" ? (undefined as unknown as number) : Number(lectureHours),
      practice_hours: practiceHours === "" ? (undefined as unknown as number) : Number(practiceHours),
    });
  };

  const SemesterRow = ({
    label,
    list,
    set,
  }: {
    label: string;
    list: number[];
    set: (v: number[]) => void;
  }) => (
    <div className="mb-3">
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="flex gap-1 flex-wrap">
        {SEMESTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s, list, set)}
            className={`w-8 h-8 rounded text-sm ${list.includes(s) ? "bg-gray-800 text-white" : "bg-gray-200"}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">
          {editing ? "Редактировать дисциплину" : "Добавить дисциплину"}
        </h2>

        <label className="block text-sm font-medium mb-1">Предмет</label>
        <input
          list="subjects-list"
          className="w-full border rounded px-3 py-2 mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Выберите предмет из справочника"
        />
        <datalist id="subjects-list">
          {subjects.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>

        <label className="block text-sm font-medium mb-1">Трек</label>
        <select
          className="w-full border rounded px-3 py-2 mb-3"
          value={trackColor}
          onChange={(e) => setTrackColor(e.target.value)}
        >
          {TRACK_COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <SemesterRow label="Семестры" list={semesters} set={setSemesters} />
        <SemesterRow label="Экзамен (семестры)" list={examSemesters} set={setExamSemesters} />
        <SemesterRow label="Зачёт (семестры)" list={creditSemesters} set={setCreditSemesters} />

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">З.е.</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-2"
              value={creditUnits}
              onChange={(e) => setCreditUnits(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Лекции</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-2"
              value={lectureHours}
              onChange={(e) => setLectureHours(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Практики</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-2"
              value={practiceHours}
              onChange={(e) => setPracticeHours(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between">
          {onDelete ? (
            <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={onDelete}>
              Удалить
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onClose}>
              Отмена
            </button>
            <button
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              disabled={!name.trim()}
              onClick={submit}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTrackPage;

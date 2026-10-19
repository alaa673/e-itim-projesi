import type { PlanItem, StudentHomeData, StudentProgressData } from '@/features/student/types';
import type { Locale } from '@/types';
import { meetingsOf } from '../db/comms';
import { profileNow, studentExams, studentGoals, studentHomework, studentMistakes, studentResults, studentSubjects, studentSupport } from '../db/learning';
import { currentDemoUser } from '../session';
import { createRandom, mockDelay } from '../utils';

export function getStudentDashboardMock(_locale: Locale, signal?: AbortSignal): Promise<StudentHomeData> {
  return mockDelay(() => {
    const now = Date.now();
    const user = currentDemoUser();
    const split = (title: string, fallback: string) => {
      const [head, tail] = title.split(' — ');
      return { title: head, detail: tail ?? fallback };
    };
    const plan: PlanItem[] = [];
    const exam = studentExams().all().find((e) => e.status === 'available');
    if (exam) plan.push({ id: exam.id, kind: 'exam', ...split(exam.title, exam.subject), subject: exam.subject, questionCount: exam.questionCount, at: exam.date });
    const homework = [...studentHomework().all()]
      .filter((h) => h.status === 'todo' && new Date(h.due).getTime() >= now - 86_400_000)
      .sort((a, b) => a.due.localeCompare(b.due))[0];
    if (homework) plan.push({ id: homework.id, kind: 'homework', ...split(homework.title, homework.subject), subject: homework.subject, at: homework.due });
    const meeting = [...meetingsOf('student').all()]
      .filter((m) => m.status === 'scheduled' && new Date(m.end).getTime() >= now)
      .sort((a, b) => a.start.localeCompare(b.start))[0];
    if (meeting) plan.push({ id: meeting.id, kind: 'meeting', ...split(meeting.title, meeting.organizer), subject: null, at: meeting.start });

    const goals = studentGoals().all();
    return {
      firstName: user.firstName,
      courses: studentSubjects().all().slice(0, 2),
      plan,
      examPrep: user.level === 'middle' ? 'LGS' : user.level === 'high' ? 'TYT' : null,
      support: studentSupport().find((s) => s.status === 'pending') ?? null,
      weeklyGoal: { done: goals.filter((g) => g.done).length, target: goals.length },
    };
  }, signal);
}

export function getStudentProgressMock(_locale: Locale, signal?: AbortSignal): Promise<StudentProgressData> {
  return mockDelay(() => {
    const random = createRandom(profileNow() === 'middle' ? 4040 : 5050);
    const timeline = [...studentResults().all()]
      .filter((r) => r.kind !== 'mock')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({ id: r.id, label: r.title.length > 18 ? `${r.title.slice(0, 16)}…` : r.title, date: r.date, score: r.score, classAverage: r.classAverage }));
    const subjects = studentSubjects()
      .all()
      .map((s) => ({
        id: s.id,
        name: s.name,
        topics: s.units
          .flatMap((u) => u.topics)
          .filter((tp) => tp.score !== null)
          .map((tp) => {
            const percent = tp.score ?? 0;
            const hasPrevious = random() < 0.7;
            return { topicId: tp.id, name: tp.name, percent, previous: hasPrevious ? Math.max(0, Math.min(100, percent + Math.round((random() - 0.6) * 18))) : null };
          }),
      }))
      .filter((s) => s.topics.length > 0);
    // Deniz's weakest maths topic is Kesirler (the teacher's support target).
    if (profileNow() === 'middle') {
      const math = subjects.find((s) => s.name === 'Matematik');
      const kesir = math?.topics.find((tp) => tp.name === 'Kesirler');
      if (kesir) Object.assign(kesir, { percent: 45, previous: 38 });
    }
    return {
      timeline,
      subjects,
      supportExercises: studentSupport(),
      goals: studentGoals().all(),
      mistakesCount: studentMistakes().all().filter((m) => !m.learned).length,
    };
  }, signal);
}

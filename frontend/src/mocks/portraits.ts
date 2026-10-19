import adminAvatar from '@/assets/avatars/admin.webp';
import eceAvatar from '@/assets/avatars/ece.webp';
import mertAvatar from '@/assets/avatars/mert.webp';
import studentAvatar from '@/assets/avatars/student.webp';
import teacherAvatar from '@/assets/avatars/teacher.webp';

/** Demo mode only: illustrated portraits of the demo people (real users show `avatarUrl` or initials). */
export const PORTRAITS: Record<string, string> = {
  'Deniz Kaya': studentAvatar,
  'Ayşe Yılmaz': teacherAvatar,
  'Hakan Öztürk': adminAvatar,
  'Ece Demir': eceAvatar,
  'Mert Arslan': mertAvatar,
};

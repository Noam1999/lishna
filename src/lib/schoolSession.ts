export interface SchoolInfo {
  id: string;
  name: string;
  code: string;
  teacherName?: string;
}

/** Pre-configured school spaces (validated again server-side by join_school_by_code) */
export const SCHOOL_CODES: Record<string, string> = {
  '5060': 'בית ספר רמב"ם',
  '8585': 'בית ספר וולפסון',
  '8080': 'בית ספר לישנא',
};

export const MAX_CLASSES_PER_SCHOOL = 4;
export const MAX_STUDENTS_PER_CLASS = 30;

const key = (uid: string) => `lishna:school:${uid}`;

export const getSchoolSession = (uid?: string | null): SchoolInfo | null => {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(key(uid));
    return raw ? (JSON.parse(raw) as SchoolInfo) : null;
  } catch {
    return null;
  }
};

export const setSchoolSession = (uid: string, info: SchoolInfo) => {
  try {
    localStorage.setItem(key(uid), JSON.stringify(info));
  } catch {
    /* ignore */
  }
};

export const clearSchoolSession = (uid: string) => {
  try {
    localStorage.removeItem(key(uid));
  } catch {
    /* ignore */
  }
};

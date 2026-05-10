export type AdminLang = "en" | "lo";

export const ADMIN_LANG_META: Record<AdminLang, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "EN" },
  lo: { flag: "🇱🇦", label: "ລາວ" },
};

const en = {
  // Header
  subtitle: "Enrollment Management",
  signOut: "Sign out",

  // Sidebar nav
  dashboard: "Dashboard",
  admission: "Admission",
  students: "Students",
  all: "All",
  pending: "Pending",
  reviewed: "Reviewed",
  accepted: "Accepted",
  rejected: "Rejected",
  visitRequests: "Visit Requests",
  archive: "Archive",
  reports: "Reports",
  school: "School",
  timetable: "Timetable",
  attendance: "Attendance",
  classes: "Classes",
  teachers: "Teachers",
  events: "Events",
  noticeboard: "Noticeboard",
  users: "Users",
  settings: "Settings",
};

const lo: typeof en = {
  subtitle: "ການຈັດການລົງທະບຽນ",
  signOut: "ອອກຈາກລະບົບ",

  dashboard: "ໜ້າຫຼັກ",
  admission: "ການຮັບສະໝັກ",
  students: "ນັກຮຽນ",
  all: "ທັງໝົດ",
  pending: "ລໍຖ້າ",
  reviewed: "ກວດສອບແລ້ວ",
  accepted: "ຮັບເຂົ້າ",
  rejected: "ປະຕິເສດ",
  visitRequests: "ຄຳຂໍຢ້ຽມຊົມ",
  archive: "ເອກະສານເກົ່າ",
  reports: "ລາຍງານ",
  school: "ໂຮງຮຽນ",
  timetable: "ຕາຕະລາງຮຽນ",
  attendance: "ການເຂົ້າຮຽນ",
  classes: "ຫ້ອງຮຽນ",
  teachers: "ຄູສອນ",
  events: "ກິດຈະກຳ",
  noticeboard: "ກະດານຂ່າວ",
  users: "ຜູ້ໃຊ້",
  settings: "ການຕັ້ງຄ່າ",
};

export const adminTranslations: Record<AdminLang, typeof en> = { en, lo };
export type AdminT = typeof en;

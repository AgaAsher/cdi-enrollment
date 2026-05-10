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

  // Chart tooltip
  enrolledLabel: "Enrolled",
  slotsAvailable: "slots available",
  slotAvailable: "slot available",
  classFull: "Class is full",
  capacityUsed: "capacity used",

  // Dashboard section
  classEnrollment: "Class Enrollment",
  enrolled: "Enrolled",
  almostFull: "Almost full",
  full: "Full",
  available: "Available",
  left: "left",
  recentApplications: "Recent Applications",
  upcomingVisits: "Upcoming Visits",
  noApplications: "No applications yet.",
  noUpcomingVisits: "No upcoming visits.",

  // Status labels (used in badges + stat cards)
  statusPending: "Pending",
  statusReviewed: "Reviewed",
  statusAccepted: "Accepted",
  statusRejected: "Rejected",

  // Visit requests section
  child: "Child",
  grade: "Grade",
  parent: "Parent",
  contact: "Contact",
  visitDate: "Visit Date",
  time: "Time",
  status: "Status",
  noVisitRequests: "No visit requests yet.",
  pastLabel: "past",
  view: "View →",

  // Reports section
  pctOfTotal: "% of total",
  applicationsByGrade: "Applications by Grade",
  applicationsByNationality: "Applications by Nationality",
  totalVisitRequests: "Total visit requests",
  upcomingVisitsLabel: "Upcoming visits",
  pastVisits: "Past visits",
  photoConsent: "Photo Consent",
  socialMediaGiven: "Social media — given",
  socialMediaNotGiven: "Social media — not given",
  postersGiven: "Posters / ads — given",
  postersNotGiven: "Posters / ads — not given",
  noData: "No data.",

  // Archive section
  deletedRecordsDesc: "Deleted student records — all data preserved",
  record: "record",
  records: "records",

  // Students section
  studentsTitle: "Students",

  // School section nav
  parents: "Parents",
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

  enrolledLabel: "ລົງທະບຽນ",
  slotsAvailable: "ຊ່ອງຫວ່າງ",
  slotAvailable: "ຊ່ອງຫວ່າງ",
  classFull: "ຫ້ອງຮຽນເຕັມ",
  capacityUsed: "ຄວາມຈຸຖືກໃຊ້",

  classEnrollment: "ການລົງທະບຽນຫ້ອງຮຽນ",
  enrolled: "ລົງທະບຽນແລ້ວ",
  almostFull: "ໃກ້ເຕັມ",
  full: "ເຕັມ",
  available: "ຫວ່າງ",
  left: "ຫວ່າງ",
  recentApplications: "ຄຳຮ້ອງຫຼ້າສຸດ",
  upcomingVisits: "ການຢ້ຽມຊົມທີ່ກຳລັງຈະມາ",
  noApplications: "ຍັງບໍ່ມີຄຳຮ້ອງ.",
  noUpcomingVisits: "ຍັງບໍ່ມີການຢ້ຽມຊົມທີ່ກຳລັງຈະມາ.",

  statusPending: "ລໍຖ້າ",
  statusReviewed: "ກວດສອບແລ້ວ",
  statusAccepted: "ຮັບເຂົ້າ",
  statusRejected: "ປະຕິເສດ",

  child: "ເດັກ",
  grade: "ລະດັບ",
  parent: "ຜູ້ປົກຄອງ",
  contact: "ຕິດຕໍ່",
  visitDate: "ວັນຢ້ຽມຊົມ",
  time: "ເວລາ",
  status: "ສະຖານະ",
  noVisitRequests: "ຍັງບໍ່ມີຄຳຂໍຢ້ຽມຊົມ.",
  pastLabel: "ຜ່ານໄປ",
  view: "ເບິ່ງ →",

  pctOfTotal: "% ຂອງທັງໝົດ",
  applicationsByGrade: "ຄຳຮ້ອງຕາມລະດັບຊັ້ນ",
  applicationsByNationality: "ຄຳຮ້ອງຕາມສັນຊາດ",
  totalVisitRequests: "ຄຳຂໍຢ້ຽມຊົມທັງໝົດ",
  upcomingVisitsLabel: "ການຢ້ຽມຊົມທີ່ກຳລັງຈະມາ",
  pastVisits: "ການຢ້ຽມຊົມທີ່ຜ່ານໄປ",
  photoConsent: "ການອະນຸຍາດຖ່າຍຮູບ",
  socialMediaGiven: "ສື່ສັງຄົມ — ອະນຸຍາດ",
  socialMediaNotGiven: "ສື່ສັງຄົມ — ບໍ່ອະນຸຍາດ",
  postersGiven: "ໂຄສະນາ — ອະນຸຍາດ",
  postersNotGiven: "ໂຄສະນາ — ບໍ່ອະນຸຍາດ",
  noData: "ບໍ່ມີຂໍ້ມູນ.",

  deletedRecordsDesc: "ບັນທຶກນັກຮຽນທີ່ຖືກລຶບ — ຂໍ້ມູນທັງໝົດຍັງຖືກຮັກສາໄວ້",
  record: "ບັນທຶກ",
  records: "ບັນທຶກ",

  studentsTitle: "ນັກຮຽນ",

  // School section nav
  parents: "ຜູ້ປົກຄອງ",
};

export const adminTranslations: Record<AdminLang, typeof en> = { en, lo };
export type AdminT = typeof en;

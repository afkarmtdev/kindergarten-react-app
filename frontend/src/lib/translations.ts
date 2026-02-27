export const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard',
    students: 'Students',
    attendance: 'Attendance',
    classes: 'Classes',
    adminPortal: 'Admin Portal',
    administrator: 'Administrator',
    logout: 'Logout',

    // Settings panel
    settings: 'Settings',
    darkMode: 'Dark Mode',
    language: 'Language',
    english: 'English',
    bahasaMelayu: 'Bahasa Melayu',

    // Dashboard
    totalStudents: 'Total Students',
    enrolled: 'Enrolled',
    active: 'Active',
    presentToday: 'Present Today',
    attendanceRate: 'Attendance Rate',
    thisMonth: 'This month',
    todayAttendance: "Today's Attendance",
    monthlySummary: 'Monthly Summary',
    noAttendanceYet: 'No attendance recorded yet today',
    noDataYet: 'No data for this month yet',
    ofStudents: 'of {n} students',

    // Students page
    addStudent: 'Add Student',
    editStudent: 'Edit Student',
    searchStudents: 'Search by name, parent...',
    allClasses: 'All Classes',
    allGenders: 'All Genders',
    boys: 'Boys',
    girls: 'Girls',
    boy: 'Boy',
    girl: 'Girl',
    clearFilters: 'Clear filters',
    noStudentsFound: 'No students found',
    addFirstStudent: 'Start by adding your first student!',
    noResultsFor: 'No results for "{q}"',
    parent: 'Parent',
    loading: 'Loading...',
    removeConfirm: 'Remove {name}?',

    // Classes page
    addClass: 'Add Class',
    editClass: 'Edit Class',
    searchClasses: 'Search by name or teacher...',
    noClassesFound: 'No classes found',
    createFirstClass: 'Create your first classroom to get started!',
    classrooms: 'classrooms',
    teacher: 'Teacher',
    students_count: '{n} students',
    capacity: 'Capacity: {n} students',
    full: '% full',
    removeClassConfirm: 'Remove class "{name}"?',

    // Attendance page
    markAllPresent: 'Mark All Present',
    saving: 'Saving...',
    saveChanges: 'Save {n} change',
    saveChangesPlural: 'Save {n} changes',
    student: 'Student',
    class: 'Class',
    markAttendance: 'Mark Attendance',
    all: 'All',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
    unsaved: 'unsaved',
    noStudentsToShow: 'No students to show',
    noStudentsMarked: 'No students marked as "{status}" yet',
    noStudentsEnrolled: 'No students enrolled',

    // Showing X of Y
    showing: 'Showing',
    of: 'of',

    // Modal
    fullName: 'Full Name',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    selectGender: 'Select gender',
    male: 'Male',
    female: 'Female',
    className: 'Class Name',
    selectClass: 'Select class',
    parentName: "Parent's Name",
    parentEmail: "Parent's Email",
    parentPhone: "Parent's Phone",
    photoUrl: 'Photo URL (optional)',
    cancel: 'Cancel',
    save: 'Save',
    saving2: 'Saving...',
    teacherName: "Teacher's Name",
    capacityLabel: 'Capacity',

    // Photo upload
    photo: 'Photo (optional)',
    uploadPhoto: 'Upload photo',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    uploading: 'Uploading...',
    uploadFailed: 'Upload failed. Please try again.',

    // Attendance export
    exportCsv: 'Export CSV',

    // Validation / errors
    required: 'This field is required',
    invalidEmail: 'Invalid email address',

    // Landing page — Nav
    about: 'About',
    contact: 'Contact',
    adminLogin: 'Admin Login',

    // Landing page — Hero
    heroTagline: 'Enrolling for 2025–2026',
    heroPart1: 'Where little minds',
    heroHighlight: 'grow big',
    heroPart2: 'ideas',
    heroSubtitle: 'A warm, loving kindergarten where curiosity is celebrated, friendships are formed, and every child discovers the joy of learning.',
    bookTour: 'Book a Tour',
    ourPrograms: 'Our Programs',

    // Landing page — Stats
    statsStudentsLabel: 'Happy Students',
    statsTeachersLabel: 'Qualified Staff',
    statsClassesLabel: 'Active Classes',
    statsRatingLabel: 'Star Rating',

    // Landing page — Features
    featuresTitle: 'Everything your child needs',
    featuresSubtitle: 'Our holistic curriculum nurtures the whole child — mind, body, and heart.',
    featureLearnTitle: 'Learn & Explore',
    featureLearnDesc: 'Hands-on learning through play and discovery',
    featureSafeTitle: 'Safe Environment',
    featureSafeDesc: 'Nurturing space where every child feels valued',
    featureArtsTitle: 'Arts & Music',
    featureArtsDesc: 'Creative expression through song and art',
    featurePlayTitle: 'Creative Play',
    featurePlayDesc: 'Imagination-led activities every single day',
    featureOutdoorTitle: 'Outdoor Time',
    featureOutdoorDesc: 'Fresh air and nature play for healthy development',
    featureClassTitle: 'Small Classes',
    featureClassDesc: 'Personalized attention in intimate class sizes',

    // Landing page — Testimonials
    testimonialsTitle: 'What parents say',
    testimonialsSubtitle: 'Hear from our happy KinderCare families',

    // Landing page — CTA
    ctaTitle: 'Ready to join our family?',
    ctaSubtitle: 'Schedule a visit and see why parents love KinderCare.',
    scheduleVisit: 'Schedule a Visit',

    // Landing page — Gallery
    galleryTitle: 'Life at KinderCare',
    gallerySubtitle: 'A peek into our colourful, joyful classrooms',

    // Student profile page
    backToStudents: 'Back to Students',
    attendanceHistory: 'Attendance History',
    noAttendanceRecords: 'No attendance records yet',
    totalRecorded: 'Total Recorded',
    presentRate: 'Present Rate',

    // Bulk import CSV
    importCsv: 'Import CSV',
    bulkImport: 'Bulk Import Students',
    csvFormatHint: 'CSV columns: full_name, date_of_birth, gender, class_name, parent_name, parent_email, parent_phone',
    importPreview: 'Preview ({n} rows)',
    validRows: '{n} valid',
    invalidRows: '{n} invalid',
    willBeSkipped: 'Invalid rows will be skipped',
    importStudents: 'Import {n} Students',
    importSuccess: 'Successfully imported {n} students',
    importFailed: 'Failed rows',
    importResult: 'Import Complete',

    // Admin — Gallery management
    gallery: 'Gallery',
    addPhoto: 'Add Photo',
    editPhoto: 'Edit Photo',
    caption: 'Caption',
    displayOrder: 'Display Order',
    isVisible: 'Visible',
    noGalleryPhotos: 'No photos yet',
    addFirstPhoto: 'Add your first gallery photo to get started!',
    removePhotoConfirm: 'Remove photo "{caption}"?',
  },

  ms: {
    // Nav
    dashboard: 'Papan Pemuka',
    students: 'Pelajar',
    attendance: 'Kehadiran',
    classes: 'Kelas',
    adminPortal: 'Portal Pentadbir',
    administrator: 'Pentadbir',
    logout: 'Log Keluar',

    // Settings panel
    settings: 'Tetapan',
    darkMode: 'Mod Gelap',
    language: 'Bahasa',
    english: 'English',
    bahasaMelayu: 'Bahasa Melayu',

    // Dashboard
    totalStudents: 'Jumlah Pelajar',
    enrolled: 'Berdaftar',
    active: 'Aktif',
    presentToday: 'Hadir Hari Ini',
    attendanceRate: 'Kadar Kehadiran',
    thisMonth: 'Bulan ini',
    todayAttendance: 'Kehadiran Hari Ini',
    monthlySummary: 'Ringkasan Bulanan',
    noAttendanceYet: 'Tiada kehadiran direkodkan hari ini',
    noDataYet: 'Tiada data untuk bulan ini',
    ofStudents: 'daripada {n} pelajar',

    // Students page
    addStudent: 'Tambah Pelajar',
    editStudent: 'Edit Pelajar',
    searchStudents: 'Cari nama, ibu bapa...',
    allClasses: 'Semua Kelas',
    allGenders: 'Semua Jantina',
    boys: 'Lelaki',
    girls: 'Perempuan',
    boy: 'Lelaki',
    girl: 'Perempuan',
    clearFilters: 'Kosongkan penapis',
    noStudentsFound: 'Tiada pelajar ditemui',
    addFirstStudent: 'Mulakan dengan menambah pelajar pertama anda!',
    noResultsFor: 'Tiada hasil untuk "{q}"',
    parent: 'Ibu Bapa',
    loading: 'Memuatkan...',
    removeConfirm: 'Buang {name}?',

    // Classes page
    addClass: 'Tambah Kelas',
    editClass: 'Edit Kelas',
    searchClasses: 'Cari nama atau guru...',
    noClassesFound: 'Tiada kelas ditemui',
    createFirstClass: 'Cipta bilik darjah pertama anda untuk bermula!',
    classrooms: 'bilik darjah',
    teacher: 'Guru',
    students_count: '{n} pelajar',
    capacity: 'Kapasiti: {n} pelajar',
    full: '% penuh',
    removeClassConfirm: 'Buang kelas "{name}"?',

    // Attendance page
    markAllPresent: 'Tandakan Semua Hadir',
    saving: 'Menyimpan...',
    saveChanges: 'Simpan {n} perubahan',
    saveChangesPlural: 'Simpan {n} perubahan',
    student: 'Pelajar',
    class: 'Kelas',
    markAttendance: 'Tandakan Kehadiran',
    all: 'Semua',
    present: 'Hadir',
    absent: 'Tidak Hadir',
    late: 'Lewat',
    excused: 'Dimaafkan',
    unsaved: 'belum simpan',
    noStudentsToShow: 'Tiada pelajar untuk ditunjukkan',
    noStudentsMarked: 'Tiada pelajar ditandakan sebagai "{status}" lagi',
    noStudentsEnrolled: 'Tiada pelajar berdaftar',

    // Showing X of Y
    showing: 'Menunjukkan',
    of: 'daripada',

    // Modal
    fullName: 'Nama Penuh',
    dateOfBirth: 'Tarikh Lahir',
    gender: 'Jantina',
    selectGender: 'Pilih jantina',
    male: 'Lelaki',
    female: 'Perempuan',
    className: 'Nama Kelas',
    selectClass: 'Pilih kelas',
    parentName: 'Nama Ibu Bapa',
    parentEmail: 'E-mel Ibu Bapa',
    parentPhone: 'Telefon Ibu Bapa',
    photoUrl: 'URL Foto (pilihan)',
    cancel: 'Batal',
    save: 'Simpan',
    saving2: 'Menyimpan...',
    teacherName: 'Nama Guru',
    capacityLabel: 'Kapasiti',

    // Photo upload
    photo: 'Foto (pilihan)',
    uploadPhoto: 'Muat naik foto',
    changePhoto: 'Tukar foto',
    removePhoto: 'Buang foto',
    uploading: 'Memuat naik...',
    uploadFailed: 'Muat naik gagal. Sila cuba lagi.',

    // Attendance export
    exportCsv: 'Eksport CSV',

    // Validation / errors
    required: 'Medan ini diperlukan',
    invalidEmail: 'Alamat e-mel tidak sah',

    // Landing page — Nav
    about: 'Tentang',
    contact: 'Hubungi',
    adminLogin: 'Log Masuk Admin',

    // Landing page — Hero
    heroTagline: 'Pendaftaran untuk 2025–2026',
    heroPart1: 'Di mana minda kecil',
    heroHighlight: 'tumbuh besar',
    heroPart2: 'dengan idea',
    heroSubtitle: 'Tadika yang mesra dan penuh kasih sayang di mana rasa ingin tahu dirai, persahabatan terbentuk, dan setiap kanak-kanak menemui kegembiraan pembelajaran.',
    bookTour: 'Tempah Lawatan',
    ourPrograms: 'Program Kami',

    // Landing page — Stats
    statsStudentsLabel: 'Pelajar Gembira',
    statsTeachersLabel: 'Kakitangan Bertauliah',
    statsClassesLabel: 'Kelas Aktif',
    statsRatingLabel: 'Penilaian Bintang',

    // Landing page — Features
    featuresTitle: 'Segala yang diperlukan anak anda',
    featuresSubtitle: 'Kurikulum holistik kami memupuk keseluruhan kanak-kanak — minda, tubuh, dan hati.',
    featureLearnTitle: 'Belajar & Meneroka',
    featureLearnDesc: 'Pembelajaran praktikal melalui permainan dan penemuan',
    featureSafeTitle: 'Persekitaran Selamat',
    featureSafeDesc: 'Ruang asuhan di mana setiap kanak-kanak berasa dihargai',
    featureArtsTitle: 'Seni & Muzik',
    featureArtsDesc: 'Ekspresi kreatif melalui lagu dan seni',
    featurePlayTitle: 'Permainan Kreatif',
    featurePlayDesc: 'Aktiviti berasaskan imaginasi setiap hari',
    featureOutdoorTitle: 'Masa Luar',
    featureOutdoorDesc: 'Udara segar dan permainan alam untuk perkembangan sihat',
    featureClassTitle: 'Kelas Kecil',
    featureClassDesc: 'Perhatian peribadi dalam saiz kelas yang intim',

    // Landing page — Testimonials
    testimonialsTitle: 'Apa kata ibu bapa',
    testimonialsSubtitle: 'Dengar dari keluarga KinderCare yang gembira',

    // Landing page — CTA
    ctaTitle: 'Bersedia untuk menyertai keluarga kami?',
    ctaSubtitle: 'Jadualkan lawatan dan lihat mengapa ibu bapa menyukai KinderCare.',
    scheduleVisit: 'Jadualkan Lawatan',

    // Landing page — Gallery
    galleryTitle: 'Kehidupan di KinderCare',
    gallerySubtitle: 'Sekilas pandang bilik darjah kami yang ceria',

    // Student profile page
    backToStudents: 'Kembali ke Pelajar',
    attendanceHistory: 'Sejarah Kehadiran',
    noAttendanceRecords: 'Tiada rekod kehadiran lagi',
    totalRecorded: 'Jumlah Direkod',
    presentRate: 'Kadar Hadir',

    // Bulk import CSV
    importCsv: 'Import CSV',
    bulkImport: 'Import Pelajar Pukal',
    csvFormatHint: 'Lajur CSV: full_name, date_of_birth, gender, class_name, parent_name, parent_email, parent_phone',
    importPreview: 'Pratonton ({n} baris)',
    validRows: '{n} sah',
    invalidRows: '{n} tidak sah',
    willBeSkipped: 'Baris tidak sah akan dilangkau',
    importStudents: 'Import {n} Pelajar',
    importSuccess: 'Berjaya import {n} pelajar',
    importFailed: 'Baris gagal',
    importResult: 'Import Selesai',

    // Admin — Gallery management
    gallery: 'Galeri',
    addPhoto: 'Tambah Foto',
    editPhoto: 'Edit Foto',
    caption: 'Kapsyen',
    displayOrder: 'Susunan Paparan',
    isVisible: 'Kelihatan',
    noGalleryPhotos: 'Tiada foto lagi',
    addFirstPhoto: 'Tambah foto galeri pertama anda untuk bermula!',
    removePhotoConfirm: 'Buang foto "{caption}"?',
  },
} as const

export type TranslationKey = keyof typeof translations.en

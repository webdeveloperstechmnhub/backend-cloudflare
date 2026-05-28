CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(json_extract(data, '$.email'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_registration_id ON users(json_extract(data, '$.registrationId'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_order_id ON users(json_extract(data, '$.orderId'));
CREATE INDEX IF NOT EXISTS idx_users_event_id ON users(json_extract(data, '$.eventId'));
CREATE INDEX IF NOT EXISTS idx_users_payment_status ON users(json_extract(data, '$.paymentStatus'));
CREATE INDEX IF NOT EXISTS idx_users_checked_in ON users(json_extract(data, '$.checkedIn'));
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(json_extract(data, '$.slug'));
CREATE INDEX IF NOT EXISTS idx_events_short_name ON events(json_extract(data, '$.shortName'));
CREATE INDEX IF NOT EXISTS idx_events_status ON events(json_extract(data, '$.status'));
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(json_extract(data, '$.featured'));
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(json_extract(data, '$.startDate'));
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email ON admins(json_extract(data, '$.email'));

CREATE TABLE IF NOT EXISTS account_users (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_users_email ON account_users(json_extract(data, '$.email'));
CREATE INDEX IF NOT EXISTS idx_account_users_role ON account_users(json_extract(data, '$.role'));

CREATE TABLE IF NOT EXISTS institutes (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_institutes_user_id ON institutes(json_extract(data, '$.user_id'));
CREATE INDEX IF NOT EXISTS idx_institutes_city ON institutes(json_extract(data, '$.city'));

CREATE TABLE IF NOT EXISTS session_bookings (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_bookings_email ON session_bookings(json_extract(data, '$.email'));
CREATE INDEX IF NOT EXISTS idx_session_bookings_status ON session_bookings(json_extract(data, '$.status'));
CREATE INDEX IF NOT EXISTS idx_session_bookings_created_at ON session_bookings(created_at);

CREATE TABLE IF NOT EXISTS student_signups (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_signups_email ON student_signups(json_extract(data, '$.email'));
CREATE INDEX IF NOT EXISTS idx_student_signups_status ON student_signups(json_extract(data, '$.status'));
CREATE INDEX IF NOT EXISTS idx_student_signups_created_at ON student_signups(created_at);

CREATE TABLE IF NOT EXISTS session_records (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_records_session_id ON session_records(json_extract(data, '$.sessionId'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_records_jti ON session_records(json_extract(data, '$.jti'));
CREATE INDEX IF NOT EXISTS idx_session_records_user_role ON session_records(json_extract(data, '$.userId'), json_extract(data, '$.role'));
CREATE INDEX IF NOT EXISTS idx_session_records_revoked ON session_records(json_extract(data, '$.revoked'));
CREATE INDEX IF NOT EXISTS idx_session_records_expires_at ON session_records(json_extract(data, '$.expiresAt'));
CREATE INDEX IF NOT EXISTS idx_session_records_last_seen ON session_records(json_extract(data, '$.lastSeen'));

CREATE TABLE IF NOT EXISTS revoked_tokens (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_revoked_tokens_jti ON revoked_tokens(json_extract(data, '$.jti'));
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_session_id ON revoked_tokens(json_extract(data, '$.sessionId'));
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user_id ON revoked_tokens(json_extract(data, '$.userId'));

CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_actor ON auth_audit_logs(json_extract(data, '$.actorUserId'));
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_action ON auth_audit_logs(json_extract(data, '$.action'));
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_created_at ON auth_audit_logs(created_at);

CREATE TABLE IF NOT EXISTS telemetry_filters (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_telemetry_filters_filter_key ON telemetry_filters(json_extract(data, '$.filterKey'));
CREATE INDEX IF NOT EXISTS idx_telemetry_filters_filter_type ON telemetry_filters(json_extract(data, '$.filterType'));
CREATE INDEX IF NOT EXISTS idx_telemetry_filters_active ON telemetry_filters(json_extract(data, '$.active'));

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(json_extract(data, '$.email'));
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_emp_id ON employees(json_extract(data, '$.empId'));
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(json_extract(data, '$.employmentStatus'));

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(json_extract(data, '$.userId'));
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(json_extract(data, '$.eventId'));
CREATE INDEX IF NOT EXISTS idx_attendance_registration_id ON attendance(json_extract(data, '$.registrationId'));
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);

CREATE TABLE IF NOT EXISTS institute_activities (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_institute_activities_institute_id ON institute_activities(json_extract(data, '$.instituteId'));
CREATE INDEX IF NOT EXISTS idx_institute_activities_status ON institute_activities(json_extract(data, '$.status'));

CREATE TABLE IF NOT EXISTS ambassador_schools (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassador_schools_name ON ambassador_schools(json_extract(data, '$.name'));

CREATE TABLE IF NOT EXISTS ambassador_applications (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ambassador_applications_school_id ON ambassador_applications(json_extract(data, '$.schoolId'));
CREATE INDEX IF NOT EXISTS idx_ambassador_applications_status ON ambassador_applications(json_extract(data, '$.status'));
CREATE INDEX IF NOT EXISTS idx_ambassador_applications_email ON ambassador_applications(json_extract(data, '$.email'));

CREATE TABLE IF NOT EXISTS ambassadors (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ambassadors_application_id ON ambassadors(json_extract(data, '$.applicationId'));
CREATE INDEX IF NOT EXISTS idx_ambassadors_school_id ON ambassadors(json_extract(data, '$.schoolId'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassadors_email ON ambassadors(json_extract(data, '$.email'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassadors_mobile_number ON ambassadors(json_extract(data, '$.mobileNumber'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassadors_instagram_id ON ambassadors(json_extract(data, '$.instagramId'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassadors_referral_code ON ambassadors(json_extract(data, '$.referralCode'));
CREATE INDEX IF NOT EXISTS idx_ambassadors_approved ON ambassadors(json_extract(data, '$.approved'));
CREATE INDEX IF NOT EXISTS idx_ambassadors_points ON ambassadors(json_extract(data, '$.points'));

CREATE TABLE IF NOT EXISTS ambassador_activities (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ambassador_activities_ambassador_id ON ambassador_activities(json_extract(data, '$.ambassadorId'));
CREATE INDEX IF NOT EXISTS idx_ambassador_activities_created_at ON ambassador_activities(created_at);

CREATE TABLE IF NOT EXISTS ambassador_referrals (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassador_referrals_ambassador_id ON ambassador_referrals(json_extract(data, '$.ambassadorId'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassador_referrals_referral_code ON ambassador_referrals(json_extract(data, '$.referralCode'));

CREATE TABLE IF NOT EXISTS ambassador_levels (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassador_levels_level_number ON ambassador_levels(json_extract(data, '$.levelNumber'));

CREATE TABLE IF NOT EXISTS ambassador_rewards (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ambassador_rewards_level_number ON ambassador_rewards(json_extract(data, '$.levelNumber'));
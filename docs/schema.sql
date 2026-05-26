CREATE DATABASE IF NOT EXISTS ghc_db;
USE ghc_db;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'attendee',
  phone VARCHAR(30),
  organization VARCHAR(160),
  designation VARCHAR(120),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE speakers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  title VARCHAR(160),
  organization VARCHAR(180),
  bio TEXT,
  photo_url VARCHAR(500),
  linkedin_url VARCHAR(500),
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE workshops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(255),
  description TEXT,
  requirements TEXT,
  learning_outcomes TEXT,
  who_should_attend TEXT,
  faq JSON,
  prerequisites TEXT,
  speaker_id INT,
  venue VARCHAR(160),
  starts_at DATETIME,
  ends_at DATETIME,
  capacity INT,
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_workshops_speaker FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE SET NULL
);

CREATE TABLE workshop_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  workshop_id INT,
  registration_id INT,
  payment_id INT,
  status ENUM('pending', 'confirmed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  registration_type ENUM('delegate', 'speaker', 'sponsor', 'media', 'student') DEFAULT 'delegate',
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
  ticket_code VARCHAR(80) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE abstracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(240) NOT NULL,
  category VARCHAR(120),
  summary TEXT NOT NULL,
  file_url VARCHAR(500),
  status ENUM('submitted', 'under_review', 'accepted', 'rejected') DEFAULT 'submitted',
  reviewer_notes TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_abstracts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  partner_type ENUM('title', 'gold', 'silver', 'knowledge', 'media', 'supporting') DEFAULT 'supporting',
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  media_type ENUM('image', 'video', 'document') NOT NULL,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  caption VARCHAR(255),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE timeline_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  event_date DATE,
  starts_at TIME,
  ends_at TIME,
  venue VARCHAR(160),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT,
  value_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  registration_id INT,
  ticket_type_id INT,
  payment_provider VARCHAR(100),
  provider_order_id VARCHAR(255),
  provider_payment_id VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(10),
  status ENUM('created', 'pending', 'paid', 'failed', 'refunded') DEFAULT 'created',
  receipt_url TEXT,
  invoice_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100),
  discount_type ENUM('flat', 'percent'),
  discount_value DECIMAL(10,2),
  max_uses INT,
  used_count INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE analytics_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_type VARCHAR(100),
  user_id INT,
  registration_id INT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  registration_id INT,
  checkin_time DATETIME,
  checkout_time DATETIME,
  workshop_id INT,
  verified_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  registration_id INT,
  certificate_type VARCHAR(100),
  pdf_url TEXT,
  issued BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  message TEXT,
  user_id INT,
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(255),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description)
VALUES
  ('admin', 'Full platform administrator'),
  ('organizer', 'Conclave content and operations manager'),
  ('speaker', 'Speaker or faculty account'),
  ('attendee', 'Registered attendee')
ON DUPLICATE KEY UPDATE description = VALUES(description);

USE student_management;

INSERT IGNORE INTO departments (id,name,code,description) VALUES
(1,'Computer Science','CS','Computing and software systems'),
(2,'Business Administration','BA','Business and management studies'),
(3,'Information Technology','IT','Information technology and systems');

INSERT IGNORE INTO programs (id,department_id,name,code,duration_years) VALUES
(1,1,'Software Engineering','SE',4),
(2,1,'Computer Science','CSE',4),
(3,3,'Information Technology','IT',4),
(4,2,'Business Administration','BBA',4);

-- $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llCw9gJqH5gR9f8Q3Gv5K
INSERT IGNORE INTO users (id,name,email,password_hash,role) VALUES
(1,'System Administrator','admin@example.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llCw9gJqH5gR9f8Q3Gv5K','ADMIN'),
(3,'Barkhad Teacher','barkhad@example.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llCw9gJqH5gR9f8Q3Gv5K','TEACHER'),
(4,'Abdiqani Student','student@example.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llCw9gJqH5gR9f8Q3Gv5K','STUDENT');

INSERT IGNORE INTO students
(id,user_id,student_id,admission_number,first_name,last_name,gender,date_of_birth,email,phone,address,guardian_name,guardian_phone,department_id,program_id,year_level,semester,admission_date,status)
VALUES
(1,4,'DDU1600','ADM-2026-001','Abdiqani','Mohamed','MALE','2002-04-12','Abdiqani@example.com','0911000001','Jijiga, Ethiopia','Mohamed Olaad','0911000002',1,1,3,1,'2024-09-15','ACTIVE'),
(2,NULL,'STU-2026-002','ADM-2026-002','Hana','Mohammed','FEMALE','2003-01-20','hana@example.com','0911000003','Jigjiga, Ethiopia','Mohammed Ali','0911000004',3,3,2,2,'2025-09-10','ACTIVE'),
(3,NULL,'STU-2026-003','ADM-2026-003','Abdi','Ali','MALE','2001-11-05','abdi@example.com','0911000005','Dire Dawa, Ethiopia','Abdi Ali','0911000006',1,2,4,1,'2023-09-11','ACTIVE');

INSERT IGNORE INTO teachers
(id,user_id,employee_id,first_name,last_name,email,phone,department_id,specialization)
VALUES
(1,3,'EMP-001','Barkhad','Abdiqani','teacher@example.com','0911222333',1,'Information Technology'),
(2,NULL,'EMP-002','Jamac','Cali','jamac@example.com','0911222444',3,'Networks');

INSERT IGNORE INTO courses
(id,department_id,teacher_id,code,title,credit_hours,semester,prerequisites)
VALUES
(1,1,1,'SE301','Software Architecture',3,1,'SE201'),
(2,1,1,'SE302','Web Engineering',3,1,'SE201'),
(3,3,2,'IT210','Computer Networks',3,2,'IT110'),
(4,1,1,'CS401','Database Systems',4,1,'CS301');

INSERT IGNORE INTO enrollments
(id,student_id,course_id,academic_year,semester,status)
VALUES
(1,1,1,'2025/26',1,'ENROLLED'),
(2,1,2,'2025/26',1,'ENROLLED'),
(3,2,3,'2025/26',2,'ENROLLED'),
(4,3,4,'2025/26',1,'ENROLLED');

INSERT IGNORE INTO attendance (enrollment_id,attendance_date,status) VALUES
(1,'2026-08-25','PRESENT'),
(1,'2026-08-26','PRESENT'),
(1,'2026-08-27','LATE'),
(2,'2026-08-25','ABSENT'),
(2,'2026-08-26','PRESENT');

INSERT IGNORE INTO grades (enrollment_id,assessment,score,max_score) VALUES
(1,'Midterm',82,100),
(1,'Final',88,100),
(2,'Midterm',76,100),
(2,'Final',84,100);

INSERT IGNORE INTO fees (student_id,description,amount,amount_paid,due_date,status) VALUES
(1,'Tuition - 2025/26',25000,18000,'2026-09-30','PARTIAL'),
(2,'Tuition - 2025/26',25000,25000,'2026-09-30','PAID'),
(3,'Tuition - 2025/26',25000,0,'2026-09-30','UNPAID');

INSERT IGNORE INTO timetable (course_id,teacher_id,room,day_of_week,start_time,end_time) VALUES
(1,1,'Room 201','MONDAY','08:00:00','10:00:00'),
(2,1,'Lab 3','WEDNESDAY','10:00:00','12:00:00'),
(3,2,'Room 105','TUESDAY','14:00:00','16:00:00');

INSERT IGNORE INTO announcements (id,title,message,target_role,created_by) VALUES
(1,'Welcome to the new semester','Course registration and timetable information is now available.','ALL',1),
(2,'Fee deadline','Please check your fee balance and settle outstanding payments before the deadline.','STUDENT',1);

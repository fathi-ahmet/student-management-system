# StudentHub Management System

StudentHub is a web-based **Student Management System** designed to help educational institutions manage students, teachers, departments, programs, courses, enrollment, attendance, grades, fees, timetables, announcements, and user accounts.

> 🚧 **StudentHub is currently under active development.** Some features are implemented, while others are planned for future releases.

---

## Features

### 🔐 Authentication & User Management

- User registration
- Administrator account approval
- Role-based authentication
- Secure password hashing
- JWT-based authentication
- Account status management

### 🛠️ Administration

- Admin dashboard
- Account approvals
- Activity log
- Student management
- Teacher management
- Department management
- Program management

### 🎓 Academic Management

- Course management
- Enrollment management
- Attendance management
- Grade management
- Fee management
- Timetable management
- Announcements

### 👨‍🎓 Student Features

- Student dashboard
- Student enrollment information
- Academic information
- Attendance information
- Account management

---

## Screenshots

### Login

![StudentHub Login](screenshots/login.png)

### Registration

![StudentHub Registration](screenshots/register.png)

### Admin Dashboard

![StudentHub Admin Dashboard](screenshots/admin_dashboard.png)

### Account Approvals

![StudentHub Account Approvals](screenshots/account_approvals.png)

### Student Management

![StudentHub Student Management](screenshots/students.png)

### Enrollment

![StudentHub Enrollment](screenshots/enrollments.png)

### Student Dashboard

![StudentHub Student Dashboard](screenshots/student_dashboard.png)

---

## Technology Stack

### Frontend

- React
- TypeScript
- React Router
- Vite
- Lucide React

### Backend

- Node.js
- Express
- JWT
- bcrypt
- CORS
- MySQL2

### Database

- MySQL
- MariaDB compatible

---

## Project Structure

```text
student-system/
│
├── client/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── .env.example
│
├── server/
│   ├── src/
│   ├── uploads/
│   ├── package.json
│   └── .env.example
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── screenshots/
│   ├── login.png
│   ├── register.png
│   ├── admin_dashboard.png
│   ├── account_approvals.png
│   ├── students.png
│   ├── enrollments.png
│   └── student_dashboard.png
│
├── .gitignore
├── package.json
└── README.md
```

---

# Installation & Setup

## Prerequisites

Before running StudentHub, make sure the following are installed:

- [Node.js](https://nodejs.org/)
- npm
- MySQL or MariaDB
- Git

Verify Node.js and npm:

```bash
node --version
npm --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/barkhad-olaad/student-system.git
cd student-system
```

---

## 2. Install Dependencies

Install the root dependencies:

```bash
npm install
```

Then install the frontend and backend dependencies:

```bash
npm run install-all
```

---

## 3. Configure the Database

Create a MySQL database named:

```text
student_management
```

If you are using XAMPP, you can create the database through **phpMyAdmin**.

Then execute the database schema:

```text
database/schema.sql
```

If you want to populate the database with sample/demo data, also execute:

```text
database/seed.sql
```

> **Note:** Make sure your MySQL/MariaDB server is running before starting the application.

---

## 4. Configure the Backend

Inside the `server` directory, create a file named:

```text
.env
```

Use the following file as your template:

```text
server/.env.example
```

Configure the database connection, JWT secret, server port, and other required environment variables according to the `.env.example` file.

> ⚠️ **Security:** Never commit your real `.env` file or database credentials to GitHub.

---

## 5. Configure the Frontend

Inside the `client` directory, create:

```text
.env
```

Use:

```text
client/.env.example
```

as the template.

For a local development environment, the API URL will normally be:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Run the Application

### Option 1 — Run Frontend and Backend Together

From the project root:

```bash
npm run dev
```

This starts both the frontend and backend using the root project's development script.

The frontend is normally available at:

```text
http://localhost:5173
```

The backend is normally available at:

```text
http://localhost:5000
```

### Option 2 — Run Frontend and Backend Separately

Start the backend:

```bash
npm run server
```

Then open another terminal and start the frontend:

```bash
npm run client
```

---

# Future Features

The following features are planned for future releases of StudentHub.

## 🔐 Authentication & User Management

- Password reset and account recovery
- Email verification
- User profile management
- Profile photo upload
- Change password functionality
- Improved session and token management
- Account activation, suspension, and deactivation controls

## 📝 Registration & Approval Workflow

- Registration status tracking
- Administrator approval notifications
- Rejection reasons and resubmission
- Registration history
- Email notifications for approval and rejection
- Improved application review interface

## 👨‍🎓 Student Management

- Advanced student search and filtering
- Student profile enhancements
- Student document management
- Student ID generation
- Printable student ID cards
- Academic history
- Student transfer and withdrawal management

## 👨‍🏫 Teacher Management

- Teacher profile management
- Teacher workload management
- Teacher availability
- Teacher assignments
- Teacher performance records

## 🎓 Academic Management

- Academic year and semester management
- Class and section management
- Course prerequisites
- Course scheduling improvements
- Academic calendar
- Curriculum management

## 📋 Attendance

- Attendance reports
- Attendance statistics and analytics
- Bulk attendance entry
- Attendance notifications
- Exportable attendance reports

## 📊 Grades & Results

- Grade calculation and GPA management
- Semester result generation
- Student transcripts
- Printable academic reports
- Grade analytics
- Result publishing controls

## 💰 Finance

- Student payment management
- Fee structures
- Payment history
- Outstanding balance tracking
- Financial reports
- Printable receipts

## 📢 Communication

- In-system notifications
- Email notifications
- Announcement targeting by role, department, or program
- Student-teacher communication
- Important event reminders

## 📈 Reports & Analytics

- Student enrollment statistics
- Attendance analytics
- Academic performance analytics
- Financial reports
- Teacher workload reports
- Dashboard charts and visualizations
- PDF and Excel report exports

## ⚙️ System Administration

- Role and permission management
- System settings
- Audit-log improvements
- Backup and restore tools
- Data import and export
- System activity monitoring

## 🎨 User Experience

- Dark mode
- Theme preferences
- Responsive mobile interface
- Improved accessibility
- Advanced dashboard customization
- Improved navigation and search
- Consistent StudentHub design system

## 🛡️ Security

- Two-factor authentication (2FA)
- Login attempt monitoring
- Account lockout protection
- Improved authorization controls
- Security audit improvements

## 🚀 Deployment

- Production deployment configuration
- Docker support
- Cloud database support
- CI/CD integration
- Production environment configuration
- Automated database backups

> **Note:** These features are planned and may be introduced incrementally in future releases.

---

# Project Status

🚧 **Active Development**

StudentHub is currently under active development. Features, functionality, security, and user interface components are continuously being improved.

---

## License

This project is currently being developed as an educational/software engineering project.

---

## Author

**Barkhad Olaad**

GitHub: [@barkhad-olaad](https://github.com/barkhad-olaad)

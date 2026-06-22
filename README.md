#  Quiz Platform

An online assessment platform inspired by Google Forms Quiz, designed to conduct secure and timed quizzes. The platform provides separate interfaces for **Users** and **Admins**, allowing administrators to create and manage quizzes while users can participate using Google Authentication.

---

#  Project Overview

A Quiz Platform is a web application that enables organizations, colleges, and teams to conduct online assessments.

Admins can create quizzes, manage questions, configure quiz duration, schedule availability, and analyze user performance.

Users can log in securely using Google Authentication, attempt available quizzes, and view their results instantly.

---

#  Features

##  User Features

-  Google Authentication Login
-  View available quizzes
-  Real-time quiz timer
-  Attempt technical MCQ quizzes
-  One attempt per quiz restriction
-  Automatic submission after time expiry
-  View score and performance analysis
-  User profile management


---

##  Admin Features

-  Secure admin login
-  Admin dashboard
-  Create and manage quizzes
-  Add, edit, delete questions
-  Set quiz duration
-  Schedule quiz start and end time
-  View participants
-  Analyze quiz results
-  Export quiz reports
-  AI quiz generator
---

#  System Architecture

```
User / Admin
      |
      |
 Next.js Frontend
      |
      |
 NestJS Backend API
      |
      |
 PostgreSQL Database
      |
      |
    pgAdmin4
```

---

# Tech Stack

## Frontend

- Next.js
- React.js
- TypeScript
- Tailwind CSS
- ShadCN UI


## Backend

- NestJS
- Node.js
- REST API
- JWT Authentication


## Database

- PostgreSQL
- pgAdmin4


## Authentication

- Google OAuth
- JWT Based Admin Authentication


---

#  Database Design

The project uses PostgreSQL with four major tables:

### Admin Table

Stores administrator authentication details.

```
admin
 |
 ├── admin_id
 ├── name
 ├── email
 └── password
```

---

### Users Table

Stores users authenticated through Google.

```
users
 |
 ├── user_id
 ├── google_id
 ├── name
 ├── email
 └── profile_image
```

---

### Quiz Table

Stores quiz information, questions, options, answers, and attempts.

```
quiz
 |
 ├── quiz_id
 ├── title
 ├── questions
 ├── options
 ├── correct_answer
 ├── duration
 ├── start_time
 └── end_time
```

---

### Results Table

Stores user responses and quiz performance.

```
results
 |
 ├── result_id
 ├── user_id
 ├── quiz_id
 ├── score
 ├── percentage
 └── user_answers
```

---

#  Project Structure

```
quiz-platform/

│
├── frontend/
│   └── Next.js Application
│
├── backend/
│   └── NestJS API
│
├── database/
│   └── SQL Scripts
│
├── docs/
│   └── Architecture & Diagrams
│
└── README.md
```

`

---

#  Security Features

- JWT authentication
- Google OAuth authentication
- Role-based access control
- One-time quiz attempt validation
- Protected API routes
- Secure password storage


---

#  Future Enhancements

- AI-generated quiz questions
- Coding-based assessments
- Leaderboard system
- Certificate generation
- Anti-cheating monitoring
- Email notifications
- Mobile application
- Advanced analytics dashboard


---


# 📄 License

This project is developed for educational and learning purposes.

---

#  Support

If you like this project, consider giving it a  on GitHub.

# 🎓 Student Score Management System - Frontend

## 📖 Overview

This repository contains the frontend application for the **Student Score Management System**.

The application is built with **Vue 3**, **TypeScript**, and **Vite**, providing a modern and responsive user interface for administrators and teachers to manage students, classes, subjects, scores, and reports.

The frontend communicates with the Laravel 12 backend through REST APIs.

---

# 🚀 Features

* User Authentication (Login & Logout)
* Dashboard
* Student Management
* Class Management
* Subject Management
* Score Management
* Report Dashboard
* Search & Filter
* Responsive User Interface

---

# 🛠 Technology Stack

| Technology      | Purpose            |
| --------------- | ------------------ |
| Vue 3           | Frontend Framework |
| TypeScript      | Type Safety        |
| Vite            | Build Tool         |
| Vue Router      | Page Navigation    |
| Pinia           | State Management   |
| Axios           | HTTP Client        |
| Bootstrap 5     | UI Framework       |
| Bootstrap Icons | Icons              |
| ESLint          | Code Linting       |
| Prettier        | Code Formatting    |

---

# 📁 Project Structure

```text
src/
│
├── assets/            # Images, styles, fonts
├── components/        # Reusable Vue components
├── layouts/           # Application layouts
├── router/            # Vue Router configuration
├── services/          # API services (Axios)
├── stores/            # Pinia stores
├── views/             # Application pages
├── App.vue
└── main.ts
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/G6-PNC-STUDEND-SCORE/G6-PNC-STUDEND-SCORE-FRONT.git
```

## Install Dependencies

```bash
npm install
```

## Install Additional Packages

```bash
npm install axios
npm install bootstrap @popperjs/core
npm install bootstrap-icons
```

---

# ▶️ Run Development Server

```bash
npm run dev
```

---

# 📦 Build for Production

```bash
npm run build
```

---

# 🎨 Format Source Code

```bash
npm run format
```

---

# 📂 Git Workflow

Main branches:

* `master` – Stable production branch
* `develop` – Main development branch

Create a feature branch:

```bash
git checkout develop
git pull origin develop

git checkout -b feature/feature-name
```

After finishing your work:

```bash
git add .
git commit -m "Add feature"

git push -u origin feature/feature-name
```

Then create a Pull Request from **feature/** → **develop**.

---

# 🔗 Backend Repository

The frontend communicates with the backend REST API.

Backend Repository:

```
https://github.com/G6-PNC-STUDEND-SCORE/G6-PNC-STUDEND-SCORE-BACK
```

---

# 👥 Team

**Project:** Student Score Management System

**Frontend Repository**

* Framework: Vue 3
* Language: TypeScript
* State Management: Pinia
* UI Framework: Bootstrap 5
* Methodology: Agile Scrum

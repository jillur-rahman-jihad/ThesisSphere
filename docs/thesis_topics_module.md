# Thesis Topics Module Documentation

The Thesis Topics Module allows faculty members to post research topics, and students to browse and apply for those topics. It includes a complete end-to-end workflow for topic assignment.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Models](#database-models)
3. [API Endpoints](#api-endpoints)
4. [Frontend Pages & Components](#frontend-pages--components)
5. [User Workflows](#user-workflows)

---

## Architecture Overview

The system is split into two primary resources:
1. **ThesisTopics**: Represents a research topic created by a faculty member.
2. **ThesisApplications**: Represents a student's request to work on a specific `ThesisTopic`.

---

## Database Models

### 1. `ThesisTopic`
Represents a thesis topic posted by a faculty member.
- **title** (String, Required)
- **description** (String)
- **category** (String)
- **keywords** (Array of Strings)
- **supervisorId** (ObjectId, Ref: `User`)
- **status** (String, Enum: `['available', 'assigned', 'completed']`)

### 2. `ThesisApplication`
Tracks student applications to specific topics.
- **topicId** (ObjectId, Ref: `ThesisTopic`, Required)
- **studentId** (ObjectId, Ref: `User`, Required)
- **message** (String) - Optional cover letter/message from the student.
- **status** (String, Enum: `['pending', 'accepted', 'rejected']`)

*Note: A compound unique index exists on `topicId` and `studentId` to prevent a student from applying to the same topic multiple times.*

---

## API Endpoints

### Topics APIs
Handled by `thesisPostController.js` and `thesisBrowseController.js`.

- **`POST /api/thesis-post`**
  - **Access**: Faculty only.
  - **Description**: Creates a new thesis topic.
  
- **`PUT /api/thesis-post/:id`**
  - **Access**: Faculty only (Must be the topic owner).
  - **Description**: Updates an existing thesis topic.
  
- **`DELETE /api/thesis-post/:id`**
  - **Access**: Faculty only (Must be the topic owner).
  - **Description**: Deletes a thesis topic.
  
- **`GET /api/thesis-browse`**
  - **Access**: Private.
  - **Query Params**: `status` (e.g., 'available'), `mine` (boolean).
  - **Description**: Fetches thesis topics. If `mine=true` is passed, it only fetches topics created by the logged-in faculty member.

### Applications APIs
Handled by `thesisApplicationController.js`.

- **`POST /api/thesis-applications`**
  - **Access**: Student only.
  - **Description**: Submits a new application for an available topic.
  
- **`GET /api/thesis-applications/my-applications`**
  - **Access**: Student only.
  - **Description**: Fetches all applications submitted by the logged-in student.
  
- **`GET /api/thesis-applications/topic/:topicId`**
  - **Access**: Faculty only (Must be the topic owner).
  - **Description**: Fetches all student applications for a specific topic.
  
- **`PUT /api/thesis-applications/:id/status`**
  - **Access**: Faculty only (Must be the topic owner).
  - **Description**: Accepts or rejects an application. If accepted, automatically rejects all other pending applications for that topic and marks the topic as `assigned`.

---

## Frontend Pages & Components

### Faculty Dashboard
1. **`PostTopics.jsx`**
   - **Path**: `/post-topics`
   - **Features**: Displays a grid of topics created by the faculty member. Allows creating, editing, and deleting topics via modals. Includes a "View Applications" button to see students who applied.

### Student Dashboard
1. **`BrowseTopics.jsx`**
   - **Path**: `/topics`
   - **Features**: Displays all `available` topics across the platform. Includes search and filtering. Students can click "Apply" to open a modal and submit their application. The button dynamically disables if they have already applied.
   
2. **`MyApplications.jsx`**
   - **Path**: `/applications`
   - **Features**: A dedicated dashboard for students to track the real-time status (`Pending Review`, `Accepted`, `Rejected`) of all topics they have applied for.

---

## User Workflows

### The Application & Assignment Flow
1. **Topic Creation**: A Faculty member navigates to "Post Topics" and creates a new topic. It defaults to an `available` status.
2. **Browsing**: A Student navigates to "Browse Topics", finds the topic, and clicks "Apply", optionally including a message.
3. **Tracking (Student)**: The Student can view their pending application in the "My Applications" tab.
4. **Reviewing (Faculty)**: The Faculty member navigates to "Post Topics" and clicks "View Applications". They see a list of all students who applied.
5. **Assigning**: The Faculty member clicks the Accept (✅) button for a specific student.
6. **System Automation**: 
   - The accepted student's application status becomes `accepted`.
   - All other pending applications for that topic become `rejected`.
   - The topic's status becomes `assigned`.
7. **Resolution**: The accepted student sees a green "Accepted" badge in their "My Applications" tab, while the others see a red "Rejected" badge. The topic no longer appears in the global "Browse Topics" view.

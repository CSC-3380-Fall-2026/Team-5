# Time Capsule App: Team 5

## Members

- **Project Manager:** Liem Tran (ltran20LSU)
- **Communications Lead:** Reese Foret (reeseforet)
- **Git Master:** Ellie Bendich (ellieb44)
- **Design Lead:** Mikayla Ashley (mashl11)
- **Quality Assurance Tester:** Alana Rattanaxay (alanar12240)

## About Our Software

Time Capsule is a mobile application that allows users to create digital time capsules to preserve memories and share them with friends.

Users can create capsules, select an unlock date, invite registered users, and add memories such as photos and messages. Capsules remain locked until their designated opening date, allowing users to revisit shared experiences in the future.

The application also includes user authentication, a searchable friends directory, and friend request management.

The frontend is built using React Native, while the backend uses Node.js and MySQL to manage user accounts, capsule information, and saved memories.

## Platforms Tested On

- Android (Android Studio Emulator)
- Windows (Development Environment)

## Important Links

- **GitHub Repository:** https://github.com/CSC-3380-Fall-2026/Team-5
- **Kanban Board:** [Insert Kanban Board Link]
- **Designs:** [Insert Design Link]
- **Style Guide(s):** [Insert Style Guide Link]

## How to Run Dev and Test Environment

### Dependencies

The following software is required to run and develop the Time Capsule application.

| Dependency | Version | Purpose |
|---|---|---|
| Node.js | 24.x | Runs the backend and development tools |
| npm | 11.x | Installs and manages project packages |
| React Native | 0.87.1 | Mobile application framework |
| React | 19.2.3 | Frontend component library |
| MySQL Server | 9.6 | Stores application data |
| MySQL Workbench | Compatible version | Database management |
| Android Studio | Current compatible version | Android emulator and SDK |
| Java Development Kit (JDK) | 17 | Android build environment |
| Git | 2.x | Version control |
| Visual Studio Code | Current version | Recommended code editor |

**Note:** These versions reflect the development environment used during the project. Verify exact versions against the current repository and installed tools before finalizing this section.

### Downloading Dependencies

Install the following tools before running the project.

1. **Node.js:** https://nodejs.org/
   - Install Node.js with npm.
   - Verify installation using `node -v` and `npm -v`.

2. **MySQL Server:** https://dev.mysql.com/downloads/mysql/
   - Install MySQL Server.
   - Configure a local MySQL connection and remember the database password.

3. **MySQL Workbench:** https://dev.mysql.com/downloads/workbench/
   - Used to view and manage application data.

4. **Android Studio:** https://developer.android.com/studio
   - Install the Android SDK and create an Android Virtual Device (AVD).

5. **Java Development Kit:** https://adoptium.net/
   - Install a compatible JDK for React Native Android development.

6. **Git:** https://git-scm.com/downloads

7. **Visual Studio Code:** https://code.visualstudio.com/
   - The free version of VS Code is sufficient for development.
   - Recommended extensions include ESLint, Prettier, and React Native Tools.

### Commands

#### 1. Clone the Repository

Open PowerShell or the VS Code terminal.

```powershell
git clone https://github.com/CSC-3380-Fall-2026/Team-5.git
cd Team-5
git checkout main
```

Use the `main` branch for the version being documented. Developers working on new features should create their own branches.

#### 2. Set Up the Backend

Navigate to the backend directory.

```powershell
cd backend
npm install
```

Create a `.env` file using the project's `.env.example` template.

Configure the local database settings:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=time_capsule_dev
```

Also configure any additional environment variables required by the current backend, including the authentication secret.

**Do not commit `.env` or real credentials to GitHub.**

Initialize the local database and complete the backend setup:

```powershell
npm run setup
```

Start the backend:

```powershell
node server.js
```

The backend should connect to MySQL and start listening for API requests.

#### 3. Set Up the Frontend

Open a second terminal and navigate to the React Native project.

```powershell
cd frontend/TimeCapsuleApp
npm install
```

Start Metro:

```powershell
npm start
```

#### 4. Run the Android Application

Open Android Studio and start an Android emulator.

In another terminal, navigate to the frontend directory and run:

```powershell
npm run android
```

The application should build and launch on the Android emulator.

Keep Metro and the backend running while testing the application.

#### 5. Test the Application

After launching the application:

1. Register a new account or log in using an existing account.
2. Create a time capsule and choose an unlock date.
3. Search for registered users and add friends to a capsule.
4. Verify that the capsule appears in the user's capsule list.
5. Close and reopen the application to confirm saved data persists.
6. Test sending, accepting, and declining friend requests.

#### 6. Verify MySQL Data

Open MySQL Workbench and connect to the local database.

To view registered users:

```sql
USE time_capsule_dev;

SELECT id, name, email, role
FROM app_users;
```

To view capsules and their registered members:

```sql
SELECT
    c.title AS capsule_name,
    u.name AS member_name
FROM capsules c
JOIN group_members gm ON c.group_id = gm.group_id
JOIN app_users u ON gm.user_id = u.id
ORDER BY c.title, u.name;
```

These queries are read-only and will not modify database records.

#### 7. Run Automated Tests

Navigate to the frontend directory:

```powershell
cd frontend/TimeCapsuleApp
```

Run the test suite:

```powershell
npm test
```

Run the TypeScript checker:

```powershell
npx tsc --noEmit
```

Fix any reported errors before submitting changes.

### Development Notes

- The frontend communicates with the Node.js backend through API requests.
- The backend connects to MySQL to store and retrieve application data.
- Android emulators must be able to access the configured backend API address.
- Keep database credentials and authentication secrets out of version control.
- Developers should test their changes locally before opening a pull request.
- New features should be developed on separate Git branches and submitted through pull requests for review.

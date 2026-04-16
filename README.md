Follow these steps to set up and run the project locally:

---

### 1. Install Docker

* Download and install **Docker Desktop**
* Make sure Docker is running before proceeding

---

### 2. Start Databases (via Docker)

Open PowerShell (or terminal) and run:

```bash
docker compose up -d
```

 Make sure you are in the same directory as `compose.yaml`

This will:

* Start all required databases
* Run them in the background
* No manual setup required

---

### 3. Install Dependencies

Run the following in **both folders**:

```bash
npm install
```

* Root folder → backend dependencies
* Frontend folder → frontend dependencies

---

### 4. Start the Project

Run these commands in **separate terminals**:

#### Backend (root folder)

```bash
npm run dev
```

#### Frontend (frontend folder)

```bash
npm run dev
```

---


* Backend will be running on its configured port
* Frontend will be running on its configured port
* Databases are already running via Docker

---

* Backend and frontend are **not integrated into a single project yet**
* Always ensure Docker is running before starting the project

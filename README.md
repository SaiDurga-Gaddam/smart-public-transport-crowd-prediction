# TransitPulse - Bus Crowd Prediction System

TransitPulse is a full-stack transit tracking and crowd prediction application. It uses a modern web frontend and a Python/Scikit-Learn backend to simulate real-world bus loads.

## Prerequisites
To run this project on any laptop, you will need:
1. **Python 3.8 or higher** installed (download from python.org).
2. A modern Web Browser (Google Chrome, Microsoft Edge, etc.).

## Project Structure (All Codes Included)
- **Frontend (UI & Logic):** `index.html`, `style.css`, `script.js`
- **Backend (API):** `backend/app.py`
- **Machine Learning (Model & Dataset Builder):** `backend/generate_data_and_model.py`
- **Dependencies:** `backend/requirements.txt`

## Step-by-Step Procedure to Run on ANY Laptop

### Step 1: Transfer the Folder
Simply copy the entire `transitpulse` folder onto a USB drive or zip it and email it to yourself. Unzip it on the new laptop.

### Step 2: Set up the Backend (Machine Learning & API)
1. Open a **Command Prompt** (or Terminal) on the new laptop.
2. Navigate into the backend folder using the `cd` command. For example:
   ```bash
   cd Desktop\transitpulse\backend
   ```
3. Install the required Python libraries by running:
   ```bash
   pip install -r requirements.txt
   ```
4. **Generate the Dataset and Train the AI Model:**
   ```bash
   python generate_data_and_model.py
   ```
   *Note: This script acts as your database generator. It will automatically create `etm_dataset.csv` (a 1-year historical dataset) and `model.pkl` (the trained AI model).*
5. **Start the Backend Server:**
   ```bash
   python app.py
   ```
   *The server will start running on `http://127.0.0.1:5000`. Leave this command prompt window open!*

### Step 3: Open the Frontend
1. Open the main `transitpulse` folder.
2. Simply **double-click the `index.html` file**.
3. It will open in your web browser (you'll see the URL starts with `file:///...`). The beautiful user interface will load, and you can start planning journeys, creating accounts, and tracking buses!

## Note on Frontend Integration
Currently, the frontend uses internal smart simulation so that the UI can function instantly without relying on the backend server. If you wish to connect them fully in the future, you would add a simple `fetch('http://127.0.0.1:5000/api/predict_buses')` call into `script.js`.

# 🧪 HepatoAI - Liver Cirrhosis Prediction Portal

HepatoAI is a premium, secure clinical decision support web application built using **Flask**, **SQLite**, and **Scikit-Learn**. It trains a **Random Forest Classifier** on the Indian Liver Patient Dataset (ILPD) to predict liver cirrhosis risk based on patient attributes like bilirubin levels, liver enzymes, and synthetic proteins.

The portal features a high-end, responsive dark-themed dashboard, detailed risk visualization gauges, secure clinician authentication, and history tracking.

---

## 📁 Repository Structure

```
Predicting-Liver-Cirrhosis-using-Advanced-Machine-Learning-Techniques/
│
├── project code/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css            # Custom premium styles & layout
│   │   └── js/
│   │       └── main.js             # Form validation & animations
│   │
│   ├── templates/
│   │   ├── layout.html             # Base shell, sidebar & navbar
│   │   ├── login.html              # Secure clinician login card
│   │   ├── register.html           # Clinician sign-up card
│   │   ├── dashboard.html          # Stats cards & summary tables
│   │   ├── predict.html            # Parameter diagnostic input form
│   │   ├── result.html             # Diagnostic score gauge & references
│   │   └── history.html            # Patient historical logs & query filters
│   │
│   ├── app.py                      # Flask Server (routes, auth, database)
│   ├── train.py                    # Preprocessing & Model training
│   ├── requirements.txt            # Python dependencies
│   ├── liver_data.csv              # Patient laboratory dataset
│   ├── liver_model.pkl             # Trained RandomForest model bin
│   └── normalizer.pkl              # Fitted Standard scaler bin
│
├── Document/
│   └── Liver_Cirrhosis_Prediction_Project_Report.pdf # Research report
│
├── .gitignore                      # Git exclusion rules
└── README.md                       # Documentation (this file)
```

---

## 💡 Key Features

- **Clinician Portal Security:** Secure user login and signup mechanisms using SQLite databases with salted and hashed passwords via Werkzeug.
- **Random Forest ML Engine:** Leverages a trained Random Forest model achieving high prediction sensitivity for Cirrhosis classifications.
- **Diagnostic Risk Gauge:** Beautiful, animated circular gauge displaying probability rating (0% to 100%).
- **Interactive Reference Comparison:** Evaluates patient biological markers against clinical reference standards, highlighting abnormal items dynamically.
- **Searchable Patient Logs:** Persistent database tracking allowing searches by patient name and filtering by diagnostic verdict.
- **Full Print Support:** Printable report views that format automatically on print commands to look like official laboratory certificates.

---

## ⚙️ Technologies Used

- **Backend:** Python, Flask, Flask-SQLAlchemy (SQLite)
- **Machine Learning:** Pandas, NumPy, Scikit-learn, Pickle
- **Frontend:** Vanilla HTML5, CSS3 Variables, ES6 JavaScript

---

## 🚀 Quick Start Guide

### 1. Clone & Set Up Directory
```bash
git clone https://github.com/Praveen-6163/Predicting-Liver-Cirrhosis-using-Advanced-Machine-Learning-Techniques.git
cd "Predicting-Liver-Cirrhosis-using-Advanced-Machine-Learning-Techniques/project code"
```

### 2. Install Requirements
Make sure Python 3.8+ is installed on your computer.
```bash
pip install -r requirements.txt
```

### 3. Train the Model
Run the preprocessor script to download the database, fit normalizers, train the classifier, and generate the model binaries:
```bash
python train.py
```

### 4. Boot Up the Server
Start the Flask development server:
```bash
python app.py
```
Open your web browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**. Create a new clinician profile and begin diagnosing.

---

## 🧠 Diagnostic Inputs Explanation

| Biological Marker | Normal Value Range | Clinical Meaning |
| :--- | :--- | :--- |
| **Total Bilirubin** | 0.1 - 1.2 mg/dL | Breakdown product of blood cells. Elevated in liver damage. |
| **Direct Bilirubin** | 0.0 - 0.3 mg/dL | Conjugated bilirubin. High levels suggest excretion blockages. |
| **Alkaline Phosphatase (ALP)** | 44 - 147 IU/L | Liver enzyme associated with bile ducts. |
| **ALT (Alamine Transferase)** | 7 - 56 IU/L | Crucial intracellular enzyme. High values indicate acute injury. |
| **AST (Aspartate Transferase)** | 10 - 40 IU/L | Enzyme found in liver and heart. High values suggest necrosis. |
| **Total Proteins** | 6.0 - 8.3 g/dL | Sum of albumin and globulins in bloodstream. |
| **Albumin** | 3.5 - 5.0 g/dL | Primary protein synthesized by liver. Low in chronic failure. |
| **A/G Ratio** | 1.0 - 2.0 | Ratio of Albumin to Globulin. Inverted in advanced cirrhosis. |

---

## 📜 License & Citation

This project is intended for educational and diagnostic reference support purposes. Created by **Praveen Medida**.

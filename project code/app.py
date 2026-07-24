import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "liver_cirrhosis_diagnostic_secret_key_12948"

# Database Configuration
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cirrhosis.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# --- Database Models ---

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    predictions = db.relationship("PredictionRecord", backref="clinician", lazy=True, cascade="all, delete-orphan")

class PredictionRecord(db.Model):
    __tablename__ = "predictions"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    patient_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False) # 'Male' or 'Female'
    total_bilirubin = db.Column(db.Float, nullable=False)
    direct_bilirubin = db.Column(db.Float, nullable=False)
    alkaline_phosphotase = db.Column(db.Integer, nullable=False)
    alamine_aminotransferase = db.Column(db.Integer, nullable=False)
    aspartate_aminotransferase = db.Column(db.Integer, nullable=False)
    total_proteins = db.Column(db.Float, nullable=False)
    albumin = db.Column(db.Float, nullable=False)
    albumin_and_globulin_ratio = db.Column(db.Float, nullable=False)
    prediction_result = db.Column(db.Integer, nullable=False) # 1: Cirrhosis, 0: Healthy
    prediction_probability = db.Column(db.Float, nullable=False) # percentage (0.0 to 100.0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# --- Authentication Decorator ---

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function

# --- Helper to load model and scaler ---

def get_model_and_scaler():
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "liver_model.pkl")
    scaler_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "normalizer.pkl")
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        return None, None
        
    with open(model_path, "rb") as mf:
        model = pickle.load(mf)
    with open(scaler_path, "rb") as sf:
        scaler = pickle.load(sf)
        
    return model, scaler

# --- Routes ---

@app.route("/")
@login_required
def dashboard():
    user_id = session["user_id"]
    user = User.query.get(user_id)
    
    # Calculate stats
    total_predictions = PredictionRecord.query.filter_by(user_id=user_id).count()
    cirrhosis_cases = PredictionRecord.query.filter_by(user_id=user_id, prediction_result=1).count()
    healthy_cases = PredictionRecord.query.filter_by(user_id=user_id, prediction_result=0).count()
    
    # Get last 5 predictions
    recent_records = PredictionRecord.query.filter_by(user_id=user_id).order_by(PredictionRecord.timestamp.desc()).limit(5).all()
    
    return render_template(
        "dashboard.html", 
        user=user, 
        total=total_predictions, 
        cirrhosis=cirrhosis_cases, 
        healthy=healthy_cases, 
        recent=recent_records
    )

@app.route("/register", methods=["GET", "POST"])
def register():
    if "user_id" in session:
        return redirect(url_for("dashboard"))
        
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")
        
        if not username or not password:
            flash("Username and password are required.", "danger")
            return render_template("register.html")
            
        if len(password) < 6:
            flash("Password must be at least 6 characters long.", "danger")
            return render_template("register.html")
            
        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return render_template("register.html")
            
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash("Username is already taken.", "danger")
            return render_template("register.html")
            
        # Create user
        hashed_password = generate_password_hash(password)
        new_user = User(username=username, password_hash=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        
        flash("Registration successful! Please log in.", "success")
        return redirect(url_for("login"))
        
    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if "user_id" in session:
        return redirect(url_for("dashboard"))
        
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            session["user_id"] = user.id
            session["username"] = user.username
            flash(f"Welcome back, {user.username}!", "success")
            return redirect(url_for("dashboard"))
        else:
            flash("Invalid username or password.", "danger")
            
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out successfully.", "success")
    return redirect(url_for("login"))

@app.route("/predict", methods=["GET", "POST"])
@login_required
def predict():
    model, scaler = get_model_and_scaler()
    if not model or not scaler:
        flash("System Error: Prediction models are not trained. Please run train.py first.", "danger")
        return redirect(url_for("dashboard"))
        
    if request.method == "POST":
        try:
            patient_name = request.form.get("patient_name", "Unknown Patient").strip()
            age = int(request.form.get("Age"))
            gender_str = request.form.get("Gender") # 'Male' or 'Female'
            gender_val = 1 if gender_str == "Male" else 0
            
            tb = float(request.form.get("Total_Bilirubin"))
            db_val = float(request.form.get("Direct_Bilirubin"))
            ap = int(request.form.get("Alkaline_Phosphotase"))
            alt = int(request.form.get("Alamine_Aminotransferase"))
            ast = int(request.form.get("Aspartate_Aminotransferase"))
            tp = float(request.form.get("Total_Proteins"))
            alb = float(request.form.get("Albumin"))
            ag = float(request.form.get("Albumin_and_Globulin_Ratio"))
            
            # Prepare DataFrame for scaling (using exact columns to match StandardScaler names)
            cols = [
                'Age', 'Gender', 'Total_Bilirubin', 'Direct_Bilirubin', 
                'Alkaline_Phosphotase', 'Alamine_Aminotransferase', 
                'Aspartate_Aminotransferase', 'Total_Proteins', 
                'Albumin', 'Albumin_and_Globulin_Ratio'
            ]
            features_df = pd.DataFrame([[age, gender_val, tb, db_val, ap, alt, ast, tp, alb, ag]], columns=cols)
            
            # Scale features
            features_scaled = scaler.transform(features_df)
            
            # Predict
            pred = model.predict(features_scaled)[0] # 1: Cirrhosis, 0: Healthy
            probs = model.predict_proba(features_scaled)[0] # [prob_healthy, prob_cirrhosis]
            
            pred_prob = probs[1] if pred == 1 else probs[0]
            pred_prob_percent = round(float(pred_prob) * 100, 2)
            
            # Save prediction
            record = PredictionRecord(
                user_id=session["user_id"],
                patient_name=patient_name,
                age=age,
                gender=gender_str,
                total_bilirubin=tb,
                direct_bilirubin=db_val,
                alkaline_phosphotase=ap,
                alamine_aminotransferase=alt,
                aspartate_aminotransferase=ast,
                total_proteins=tp,
                albumin=alb,
                albumin_and_globulin_ratio=ag,
                prediction_result=int(pred),
                prediction_probability=pred_prob_percent
            )
            
            db.session.add(record)
            db.session.commit()
            
            return redirect(url_for("result", record_id=record.id))
            
        except Exception as e:
            flash(f"Error executing prediction: {str(e)}", "danger")
            
    return render_template("predict.html")

@app.route("/result/<int:record_id>")
@login_required
def result(record_id):
    record = PredictionRecord.query.get_or_404(record_id)
    # Ensure this record belongs to the logged-in user
    if record.user_id != session["user_id"]:
        flash("Unauthorized access to patient record.", "danger")
        return redirect(url_for("dashboard"))
        
    return render_template("result.html", record=record)

@app.route("/history")
@login_required
def history():
    user_id = session["user_id"]
    query = PredictionRecord.query.filter_by(user_id=user_id)
    
    # Search functionality
    search = request.args.get("search", "").strip()
    if search:
        query = query.filter(PredictionRecord.patient_name.ilike(f"%{search}%"))
        
    # Filter functionality
    risk_filter = request.args.get("risk", "")
    if risk_filter == "cirrhosis":
        query = query.filter_by(prediction_result=1)
    elif risk_filter == "healthy":
        query = query.filter_by(prediction_result=0)
        
    records = query.order_by(PredictionRecord.timestamp.desc()).all()
    
    return render_template("history.html", records=records, search=search, risk_filter=risk_filter)

@app.route("/delete_record/<int:record_id>", methods=["POST"])
@login_required
def delete_record(record_id):
    record = PredictionRecord.query.get_or_404(record_id)
    if record.user_id != session["user_id"]:
        flash("Unauthorized action.", "danger")
        return redirect(url_for("history"))
        
    db.session.delete(record)
    db.session.commit()
    flash(f"Patient record for '{record.patient_name}' deleted.", "success")
    return redirect(url_for("history"))

@app.route("/clear_history", methods=["POST"])
@login_required
def clear_history():
    user_id = session["user_id"]
    PredictionRecord.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    flash("All patient prediction history has been cleared.", "success")
    return redirect(url_for("history"))

# --- Database Initialization ---

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=5000)

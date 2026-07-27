// Firebase Client Authentication Integration
// Handles Google OAuth Sign-in flow and Flask Session synchronization

document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleSignInBtn");
  if (!googleBtn) return;

  // 1. Firebase JS Client Configuration
  const firebaseConfig = window.firebaseConfigData;
  if (!firebaseConfig || firebaseConfig.apiKey === "placeholder-api-key") {
    console.warn("Firebase is running in local mockup/development fallback mode because credentials are not configured yet.");
  }

  // 2. Load and initialize Firebase modules
  try {
    // If Firebase is already initialized, use it
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (error) {
    console.error("Firebase SDK initialization failed:", error);
    setupFallbackMockHandler(googleBtn);
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  
  googleBtn.addEventListener("click", () => {
    // Show loading state
    googleBtn.disabled = true;
    googleBtn.innerHTML = `
      <span class="animate-spin" style="display:inline-block; width:18px; height:18px; border:2px solid currentColor; border-radius:50%; border-top-color:transparent; margin-right:8px;"></span>
      Authenticating...
    `;

    // Trigger Firebase Google Popup
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        // Get the Firebase ID token
        return result.user.getIdToken();
      })
      .then((idToken) => {
        // Send ID token to Flask backend
        return fetch("/login/firebase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id_token: idToken })
        });
      })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          window.location.href = data.redirect;
        } else {
          showAuthError(data.message || "Failed to sync session with server.");
          resetButtonState(googleBtn);
        }
      })
      .catch((error) => {
        console.error("Firebase Google Auth Error:", error);
        
        // Check if it's a real Firebase project error due to placeholders
        if (firebaseConfig.apiKey === "placeholder-api-key" || error.code === "auth/invalid-api-key") {
          console.log("Triggering local mock Google Login simulation due to placeholder credentials.");
          simulateMockLogin(googleBtn);
        } else {
          showAuthError(error.message || "Google Authentication failed.");
          resetButtonState(googleBtn);
        }
      });
  });
});

// Reset the Google Sign-in button to its original state
function resetButtonState(btn) {
  btn.disabled = false;
  btn.innerHTML = `
    <svg class="google-logo" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
    Sign in with Google
  `;
}

// Display error alert banner
function showAuthError(message) {
  // Remove existing errors if any
  const existingAlerts = document.querySelectorAll(".alert-container");
  existingAlerts.forEach(el => el.remove());

  const alertHTML = `
    <div class="alert-container" style="margin-bottom: 20px;">
      <div class="alert alert-danger" role="alert">
        <span class="alert-msg">${message}</span>
        <button class="alert-dismiss-btn" onclick="this.parentElement.style.display='none';">&times;</button>
      </div>
    </div>
  `;
  const card = document.querySelector(".auth-card");
  if (card) {
    card.insertAdjacentHTML("afterbegin", alertHTML);
  }
}

// Setup fallback mock login handler if Firebase script fails to initialize entirely
function setupFallbackMockHandler(btn) {
  btn.addEventListener("click", () => {
    simulateMockLogin(btn);
  });
}

// Simulates a Google Login locally when Firebase project keys are not yet configured by the user
function simulateMockLogin(btn) {
  // Inject modal styles if not already present
  if (!document.getElementById("googleMockModalStyles")) {
    const styleEl = document.createElement("style");
    styleEl.id = "googleMockModalStyles";
    styleEl.innerHTML = `
      .google-mock-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(9, 12, 21, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      .google-mock-modal-overlay.active {
        opacity: 1;
      }
      .google-mock-modal-container {
        background: #0f1524;
        border: 1px solid rgba(99, 102, 241, 0.25);
        box-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.15);
        border-radius: 16px;
        width: 95%;
        max-width: 480px;
        padding: 24px;
        transform: scale(0.9);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        color: #f8fafc;
        position: relative;
        text-align: left;
      }
      .google-mock-modal-overlay.active .google-mock-modal-container {
        transform: scale(1);
      }
      .google-mock-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding-bottom: 12px;
      }
      .google-mock-modal-header h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
        color: #f8fafc;
      }
      .google-mock-modal-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
        line-height: 1;
      }
      .google-mock-modal-close:hover {
        color: #f43f5e;
      }
      .google-mock-intro {
        font-size: 0.9rem;
        color: #94a3b8;
        margin-bottom: 20px;
        line-height: 1.5;
      }
      .google-mock-form-group {
        margin-bottom: 20px;
      }
      .google-mock-form-group label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: #94a3b8;
        margin-bottom: 8px;
        text-align: left;
      }
      .google-mock-input {
        width: 100%;
        padding: 12px 16px;
        background: rgba(10, 15, 28, 0.6);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        color: #f8fafc;
        font-size: 0.95rem;
        transition: all 0.2s;
      }
      .google-mock-input:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
      }
      .google-mock-action-row {
        margin-top: 24px;
      }
      .google-mock-submit-btn {
        width: 100%;
        padding: 12px;
        background: #6366f1;
        border: none;
        border-radius: 8px;
        color: #fff;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .google-mock-submit-btn:hover {
        background: #4f46e5;
        box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
      }
      .google-mock-divider {
        height: 1px;
        background: rgba(255,255,255,0.08);
        margin: 20px 0;
      }
      .google-mock-instructions {
        text-align: left;
      }
      .google-mock-toggle-btn {
        background: transparent;
        border: none;
        color: #6366f1;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 8px 0;
        transition: all 0.2s;
      }
      .google-mock-toggle-btn:hover {
        color: #f8fafc;
      }
      .google-mock-toggle-btn .toggle-arrow {
        font-size: 0.75rem;
        transition: transform 0.2s ease;
        margin-left: 8px;
      }
      .google-mock-toggle-btn.active .toggle-arrow {
        transform: rotate(180deg);
      }
      .google-mock-instructions-content {
        margin-top: 10px;
        max-height: 200px;
        overflow-y: auto;
        font-size: 0.8rem;
        color: #94a3b8;
        background: rgba(10, 15, 28, 0.4);
        padding: 12px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .google-mock-instructions-content p {
        margin-bottom: 8px;
        line-height: 1.4;
      }
      .google-mock-instructions-content pre {
        background: rgba(0, 0, 0, 0.3);
        padding: 8px;
        border-radius: 4px;
        overflow-x: auto;
        margin-bottom: 8px;
        color: #a7f3d0;
        text-align: left;
      }
      .google-mock-instructions-content code {
        font-family: monospace;
      }
      .google-mock-instructions-content .instruction-warning {
        color: #fca5a5;
        margin-bottom: 0;
      }
      .google-mock-instructions-content.hidden {
        display: none;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Create the modal container
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "google-mock-modal-overlay";
  modalOverlay.innerHTML = `
    <div class="google-mock-modal-container">
      <div class="google-mock-modal-header">
        <h3>Google Sign-In Fallback</h3>
        <button class="google-mock-modal-close" id="googleMockCloseBtn">&times;</button>
      </div>
      <div class="google-mock-modal-body">
        <p class="google-mock-intro">Firebase credentials are not configured yet on this environment. To test Google login under your email, please enter it below:</p>
        
        <div class="google-mock-form-group">
          <label for="googleMockEmailInput">Clinician Email Address</label>
          <input type="email" id="googleMockEmailInput" class="google-mock-input" placeholder="e.g. yourname@gmail.com" required>
        </div>
        
        <div class="google-mock-action-row">
          <button type="button" id="googleMockSubmitBtn" class="google-mock-submit-btn">Continue to Dashboard</button>
        </div>

        <div class="google-mock-divider"></div>

        <div class="google-mock-instructions">
          <button type="button" id="googleMockInstructionsToggleBtn" class="google-mock-toggle-btn">
            <span>⚙️ Configure Real Google Sign-In</span>
            <span class="toggle-arrow">▼</span>
          </button>
          <div id="googleMockInstructionsContentPanel" class="google-mock-instructions-content hidden">
            <p>To enable the real Google Auth popup on Vercel, define these Environment Variables in your Vercel Project Settings:</p>
            <pre><code>FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id</code></pre>
            <p class="instruction-warning">Then add <strong>hepato-ai.vercel.app</strong> to "Authorized Domains" in your Firebase Auth Settings console.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalOverlay);

  // Animate in
  setTimeout(() => {
    modalOverlay.classList.add("active");
  }, 10);

  const emailInput = document.getElementById("googleMockEmailInput");
  const submitBtn = document.getElementById("googleMockSubmitBtn");
  const closeBtn = document.getElementById("googleMockCloseBtn");
  const toggleBtn = document.getElementById("googleMockInstructionsToggleBtn");
  const panel = document.getElementById("googleMockInstructionsContentPanel");

  emailInput.focus();

  // Close helper
  const closeModal = (reason = "cancelled") => {
    modalOverlay.classList.remove("active");
    setTimeout(() => {
      modalOverlay.remove();
    }, 250);
    
    if (reason === "cancelled") {
      showAuthError("Google Sign-in was cancelled.");
      resetButtonState(btn);
    }
  };

  // Close events
  closeBtn.addEventListener("click", () => closeModal("cancelled"));
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal("cancelled");
  });

  // Toggle instructions
  toggleBtn.addEventListener("click", () => {
    toggleBtn.classList.toggle("active");
    panel.classList.toggle("hidden");
  });

  // Handle enter key on input
  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitBtn.click();
    }
  });

  // Handle submit
  submitBtn.addEventListener("click", () => {
    const userEmail = emailInput.value.trim();
    if (!userEmail) {
      alert("Email address cannot be empty.");
      emailInput.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      alert("Please enter a valid email address.");
      emailInput.focus();
      return;
    }

    // Submit mock sign-in request
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Authenticating...";

    const namePart = userEmail.split("@")[0];
    const formattedName = namePart
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const header = b64EncodeUnicode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = b64EncodeUnicode(JSON.stringify({
      sub: "mock-clinician-" + Math.floor(Math.random() * 100000),
      email: userEmail,
      name: "Dr. " + formattedName,
      email_verified: true
    }));
    const mockToken = `${header}.${payload}.mock-signature-hash`;

    fetch("/login/firebase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id_token: mockToken })
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        window.location.href = data.redirect;
      } else {
        showAuthError("Demo Login simulation failed.");
        closeModal("failed");
      }
    })
    .catch((err) => {
      console.error("Mock login server error:", err);
      showAuthError("Failed to connect to the backend server.");
      closeModal("failed");
    });
  });
}

// Safe base64 unicode encoder helper
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes(match, p1) {
      return String.fromCharCode('0x' + p1);
  })).replace(/=/g, "");
}

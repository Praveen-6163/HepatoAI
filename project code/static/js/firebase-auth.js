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
  // Prompt the user for their email address since Firebase keys are not configured yet
  const userEmail = prompt(
    "Firebase API keys are not configured.\n\nTo simulate Google Sign-in locally, please enter your email address below:"
  );
  
  if (userEmail === null) {
    // User cancelled the prompt
    showAuthError("Google Sign-in was cancelled.");
    resetButtonState(btn);
    return;
  }
  
  const trimmedEmail = userEmail.trim();
  if (!trimmedEmail) {
    showAuthError("Email address cannot be empty.");
    resetButtonState(btn);
    return;
  }
  
  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    showAuthError("Please enter a valid email address.");
    resetButtonState(btn);
    return;
  }

  // Derive a name from the email
  const namePart = trimmedEmail.split("@")[0];
  const formattedName = namePart
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Create a mock Firebase ID token containing the user-provided profile payload
  const header = b64EncodeUnicode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64EncodeUnicode(JSON.stringify({
    sub: "mock-clinician-" + Math.floor(Math.random() * 100000),
    email: trimmedEmail,
    name: "Dr. " + formattedName,
    email_verified: true
  }));
  const mockToken = `${header}.${payload}.mock-signature-hash`;

  // Send mock token to Flask
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
      resetButtonState(btn);
    }
  })
  .catch((err) => {
    console.error("Mock login server error:", err);
    showAuthError("Failed to connect to the backend server.");
    resetButtonState(btn);
  });
}

// Safe base64 unicode encoder helper
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes(match, p1) {
      return String.fromCharCode('0x' + p1);
  })).replace(/=/g, "");
}

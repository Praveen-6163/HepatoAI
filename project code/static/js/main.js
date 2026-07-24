/**
 * HEPATOAI FRONTEND INTERACTIVE LOGIC
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Mobile Sidebar Toggle
  const sidebar = document.getElementById("sidebar");
  const mobileToggleBtn = document.getElementById("mobileToggleBtn");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");

  if (mobileToggleBtn && sidebar) {
    mobileToggleBtn.addEventListener("click", () => {
      sidebar.classList.add("show");
    });
  }

  if (sidebarCloseBtn && sidebar) {
    sidebarCloseBtn.addEventListener("click", () => {
      sidebar.classList.remove("show");
    });
  }

  // Close sidebar on navigation in mobile view
  document.addEventListener("click", (e) => {
    if (sidebar && sidebar.classList.contains("show")) {
      if (!sidebar.contains(e.target) && e.target !== mobileToggleBtn && !mobileToggleBtn.contains(e.target)) {
        sidebar.classList.remove("show");
      }
    }
  });

  // 2. Set Current Date in Header
  const dateBadge = document.getElementById("currentDateBadge");
  if (dateBadge) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    dateBadge.textContent = today.toLocaleDateString('en-US', options);
  }

  // 3. Auto-dismiss Flash Alerts after 5 seconds
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
      alert.style.opacity = "0";
      alert.style.transform = "translateY(-10px)";
      setTimeout(() => {
        alert.style.display = "none";
      }, 600);
    }, 5000);
  });

  // 4. Clinical Form Dynamic Validation & Guidance
  const predictForm = document.getElementById("predictForm");
  if (predictForm) {
    const totalBilirubinInput = document.getElementById("Total_Bilirubin");
    const directBilirubinInput = document.getElementById("Direct_Bilirubin");

    if (totalBilirubinInput && directBilirubinInput) {
      const validateBilirubin = () => {
        const tb = parseFloat(totalBilirubinInput.value);
        const db = parseFloat(directBilirubinInput.value);
        
        if (!isNaN(tb) && !isNaN(db) && db > tb) {
          directBilirubinInput.setCustomValidity("Direct Bilirubin cannot exceed Total Bilirubin.");
          // Trigger browser validation UI
          directBilirubinInput.reportValidity();
        } else {
          directBilirubinInput.setCustomValidity("");
        }
      };

      totalBilirubinInput.addEventListener("input", validateBilirubin);
      directBilirubinInput.addEventListener("input", validateBilirubin);
    }
    
    // Add animations to submission
    predictForm.addEventListener("submit", (e) => {
      const submitBtn = predictForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite; margin-right: 8px;">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Running ML Classifier...
        `;
      }
    });
  }
});

// Add rotation keyframes via inline styles for spin animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  display: inline-block;
}
`;
document.head.appendChild(styleSheet);

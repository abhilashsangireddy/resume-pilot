import { showToast } from './utils.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logoutBtn');
const userDisplayName = document.getElementById('userDisplayName');

// Initialize authentication
export function initAuth() {
    setupEventListeners();
    checkAuth();
}

// Setup event listeners
function setupEventListeners() {
    // Show/Hide Forms
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Handle Register
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showDashboard(data.user);
            showToast('Login successful!');
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('An error occurred during login', 'error');
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message);
            // Switch to login form
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
            // Clear register form
            registerForm.reset();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('An error occurred during registration', 'error');
    }
}

// Handle Logout
function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAuth();
    showToast('Logged out successfully');
}

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        const user = JSON.parse(localStorage.getItem('user'));
        showDashboard(user);
    }
}

// Show dashboard
export function showDashboard(user) {
    if (authContainer && dashboard) {
        authContainer.style.display = 'none';
        dashboard.style.display = 'block';
        // Update username display
        if (userDisplayName) {
            userDisplayName.textContent = user.username;
        }
        
        // Import and initialize dashboard
        import('./dashboard.js').then(module => {
            module.initDashboard();
        });
    }
}

// Show auth form
export function showAuth() {
    if (authContainer && dashboard) {
        dashboard.style.display = 'none';
        authContainer.style.display = 'block';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
    }
} 
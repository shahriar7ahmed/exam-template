// ==================== API Configuration ====================
const API_BASE = 'http://localhost:3000/api';

// ==================== Token Management ====================
function setToken(token) {
    localStorage.setItem('token', token);
}

function getToken() {
    return localStorage.getItem('token');
}

function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    return !!getToken();
}

function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
}

// ==================== API Calls ====================
async function apiCall(endpoint, method = 'GET', data = null, requiresAuth = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (requiresAuth) {
        const token = getToken();
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Request failed');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ==================== Auth Functions ====================
async function register(name, email, password) {
    return await apiCall('/auth/register', 'POST', { name, email, password });
}

async function login(email, password) {
    const result = await apiCall('/auth/login', 'POST', { email, password });
    if (result.token) {
        setToken(result.token);
        setUser(result.user);
    }
    return result;
}

function logout() {
    removeToken();
    window.location.href = 'login.html';
}

// ==================== User Functions ====================
async function getProfile() {
    return await apiCall('/users/me', 'GET', null, true);
}

async function updateProfile(data) {
    return await apiCall('/users/me', 'PUT', data, true);
}

// ==================== Admin Functions ====================
async function getAllUsers() {
    return await apiCall('/users', 'GET', null, true);
}

async function updateUser(id, data) {
    return await apiCall(`/users/${id}`, 'PUT', data, true);
}

async function deleteUser(id) {
    return await apiCall(`/users/${id}`, 'DELETE', null, true);
}

// ==================== Auth Protection ====================
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function requireAdmin() {
    if (!isLoggedIn() || !isAdmin()) {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// ==================== UI Helpers ====================
function showMessage(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.className = `p-3 rounded-lg mb-4 ${isError ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`;
        el.style.display = 'block';
    }
}

function hideMessage(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.style.display = 'none';
    }
}

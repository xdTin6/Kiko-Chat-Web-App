// Global Variables
let currentUser = null;
let currentChat = null;
let isAdmin = false;
let mediaRecorder = null;
let recordedChunks = [];
let recordingType = 'voice';
let recordingStartTime = null;
let recordingTimer = null;
let wallpapersEnabled = true;
let currentWallpaper = 'gradient-1';

// Admin credentials - using username/passcode system
const ADMIN_CREDENTIALS = {
    username: 'admin',
    passcode: 'admin123'
};

// Demo user database (username/passcode system)
const demoUsers = {
    'admin': {
        pass: 'admin123',
        role: 'admin',
        profile: {
            displayName: 'Admin',
            bio: 'System Administrator',
            profilePic: '',
            hashtag: '#admin'
        }
    },
    'alice': {
        pass: 'alice123',
        role: 'user',
        profile: {
            displayName: 'Alice Johnson',
            bio: 'Software Developer',
            profilePic: '',
            hashtag: '#alice123'
        }
    },
    'bob': {
        pass: 'bob123',
        role: 'user',
        profile: {
            displayName: 'Bob Smith',
            bio: 'Designer',
            profilePic: '',
            hashtag: '#bob456'
        }
    }
};

// Firebase configuration (for future integration)
const firebaseConfig = {
    apiKey: "AIzaSyAe_ZfZ8rKCke47UeA9Kcs8cXpD6-G6RAQ",
    authDomain: "kiko-chat-b6435.firebaseapp.com",
    databaseURL: "https://kiko-chat-b6435-default-rtdb.firebaseio.com",
    projectId: "kiko-chat-b6435",
    storageBucket: "kiko-chat-b6435.appspot.com",
    messagingSenderId: "896370793240",
    appId: "1:896370793240:web:3f14442a5d80cd71fb1c6d"
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('KikoChat loading...');
    setupGlobalFunctions();
    loadUserSettings();
    setupEventListeners();
    setupFormHandlers();
    setupAnimations();
    
    // Show login page
    showLoginPage();
});

// Setup Global Functions
function setupGlobalFunctions() {
    // Make functions globally available
    window.switchTab = switchTab;
    window.handleLogin = handleLogin;
    window.handleAdminCreateUser = handleAdminCreateUser;
    window.logout = logout;
    window.changeAvatar = changeAvatar;
    window.updateProfile = updateProfile;
    window.toggleWallpaper = toggleWallpaper;
    window.startNewChat = startNewChat;
    window.closeUserSelectModal = closeUserSelectModal;
    window.sendMessage = sendMessage;
    window.startVoiceRecording = startVoiceRecording;
    window.startVideoRecording = startVideoRecording;
    window.startRecording = startRecording;
    window.stopRecording = stopRecording;
    window.sendRecording = sendRecording;
    window.cancelRecording = cancelRecording;
    window.playVoiceMessage = playVoiceMessage;
    window.playVideoMessage = playVideoMessage;
    window.editUser = editUser;
    window.switchMainTab = switchMainTab;
    window.handleMessageKeyPress = handleMessageKeyPress;
    window.toggleWallpaperEnabled = toggleWallpaperEnabled;
    window.selectWallpaper = selectWallpaper;
}

// Tab switching function
function switchTab(tab) {
    console.log('Switching to tab:', tab);
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked tab button
    const activeTab = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.textContent.toLowerCase().trim() === tab
    );
    
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Update forms visibility
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
        form.style.display = 'none';
    });
    
    const targetForm = document.getElementById(tab + 'Form');
    if (targetForm) {
        targetForm.classList.add('active');
        targetForm.style.display = 'block';
        console.log('Activated form:', tab + 'Form');
    } else {
        console.error('Form not found:', tab + 'Form');
    }
}

// Setup Form Handlers
function setupFormHandlers() {
    console.log('Setting up form handlers...');
    
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            handleLogin(e);
            return false;
        };
        console.log('Login form handler attached');
    }
    
    // Admin form handler
    const adminForm = document.getElementById('adminForm');
    if (adminForm) {
        adminForm.onsubmit = function(e) {
            e.preventDefault();
            handleAdminCreateUser(e);
            return false;
        };
        console.log('Admin form handler attached');
    }
    
    // Tab buttons with direct onclick
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        const tabName = btn.textContent.toLowerCase().trim();
        btn.onclick = function(e) {
            e.preventDefault();
            switchTab(tabName);
            return false;
        };
    });
    
    console.log('Form handlers setup complete');
}

// Setup Event Listeners
function setupEventListeners() {
    // Remove problematic event listeners that interfere with input focus
    // Focus on essential functionality only
    
    // Navigation
    setupNavigation();
    
    // Message Input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', handleMessageKeyPress);
        messageInput.addEventListener('input', autoResizeTextarea);
    }
    
    // Profile Management
    setupProfileListeners();
    
    // Settings
    setupSettingsListeners();
    
    // Mobile Navigation
    setupMobileNavigation();
}

// Setup Animations
function setupAnimations() {
    // Animate welcome text
    setTimeout(() => {
        const welcomeText = document.querySelector('.welcome-text');
        if (welcomeText) {
            welcomeText.style.opacity = '0';
            welcomeText.style.transform = 'translateY(20px)';
            welcomeText.style.transition = 'all 1s ease-out';
            
            // Trigger animation
            setTimeout(() => {
                welcomeText.style.opacity = '1';
                welcomeText.style.transform = 'translateY(0)';
            }, 100);
        }
    }, 500);
}

// Load User Settings
function loadUserSettings() {
    const savedWallpaperEnabled = localStorage.getItem('wallpapersEnabled');
    const savedWallpaper = localStorage.getItem('currentWallpaper');
    
    if (savedWallpaperEnabled !== null) {
        wallpapersEnabled = savedWallpaperEnabled === 'true';
    }
    
    if (savedWallpaper) {
        currentWallpaper = savedWallpaper;
    }
    
    updateWallpaperSettings();
}

// Authentication Handlers
function handleLogin(e) {
    if (e) e.preventDefault();
    console.log('Login form submitted');
    
    const username = document.getElementById('loginUsername').value.trim();
    const passcode = document.getElementById('loginPasscode').value;
    
    console.log('Login attempt for username:', username);
    
    if (!username || !passcode) {
        alert('Please fill in all fields');
        return false;
    }
    
    // Check credentials against demo database
    if (demoUsers[username] && demoUsers[username].pass === passcode) {
        // Successful authentication
        currentUser = {
            uid: username,
            username: username,
            role: demoUsers[username].role,
            profile: demoUsers[username].profile
        };
        
        console.log('Login successful for:', username);
        checkAdminStatus();
        showChatApp();
        setupDemoData();
        
        // Clear form
        document.getElementById('loginForm').reset();
    } else {
        alert('Invalid username or passcode');
    }
    
    return false;
}

function handleAdminCreateUser(e) {
    if (e) e.preventDefault();
    console.log('Admin create user form submitted');
    
    const adminUsername = document.getElementById('adminUsername').value.trim();
    const adminPasscode = document.getElementById('adminPasscode').value;
    const newUsername = document.getElementById('adminCreateUsername').value.trim();
    const newPasscode = document.getElementById('adminCreatePasscode').value;
    
    // Verify admin credentials
    if (adminUsername !== ADMIN_CREDENTIALS.username || adminPasscode !== ADMIN_CREDENTIALS.passcode) {
        alert('Invalid admin credentials');
        return false;
    }
    
    if (!newUsername || !newPasscode) {
        alert('Please fill in all fields for the new user');
        return false;
    }
    
    if (demoUsers[newUsername]) {
        alert('Username already exists');
        return false;
    }
    
    // Create new user in demo database
    demoUsers[newUsername] = {
        pass: newPasscode,
        role: 'user',
        profile: {
            displayName: newUsername,
            bio: '',
            profilePic: '',
            hashtag: `#${newUsername}${Math.floor(Math.random() * 1000)}`
        }
    };
    
    alert(`User "${newUsername}" created successfully!\nUsername: ${newUsername}\nPasscode: ${newPasscode}\nHashtag: ${demoUsers[newUsername].profile.hashtag}`);
    document.getElementById('adminForm').reset();
    
    // Refresh admin panel if currently viewing it
    if (document.getElementById('adminView') && !document.getElementById('adminView').classList.contains('hidden')) {
        loadAdminData();
    }
    
    return false;
}

// Check if user is admin
function checkAdminStatus() {
    isAdmin = currentUser.role === 'admin';
    const adminNav = document.getElementById('adminNav');
    if (adminNav) {
        adminNav.style.display = isAdmin ? 'flex' : 'none';
    }
}

// Show/Hide Pages
function showLoginPage() {
    const loginPage = document.getElementById('loginPage');
    const chatApp = document.getElementById('chatApp');
    
    if (loginPage) loginPage.classList.remove('hidden');
    if (chatApp) chatApp.classList.add('hidden');
}

function showChatApp() {
    const loginPage = document.getElementById('loginPage');
    const chatApp = document.getElementById('chatApp');
    
    if (loginPage) loginPage.classList.add('hidden');
    if (chatApp) chatApp.classList.remove('hidden');
    
    // Load user profile
    loadUserProfile();
    loadChats();
}

// Setup Demo Data
function setupDemoData() {
    // Update user info in sidebar
    const nameEl = document.getElementById('currentUserName');
    const hashtagEl = document.getElementById('currentUserHashtag');
    
    if (nameEl) nameEl.textContent = currentUser.profile.displayName || currentUser.username;
    if (hashtagEl) hashtagEl.textContent = currentUser.profile.hashtag || `#${currentUser.username}`;
    
    // Create demo chat list (exclude current user)
    const demoChats = [];
    for (const [username, userData] of Object.entries(demoUsers)) {
        if (username !== currentUser.username) {
            demoChats.push({
                username: username,
                name: userData.profile.displayName,
                hashtag: userData.profile.hashtag,
                lastMessage: 'Click to start chatting!'
            });
        }
    }
    
    displayDemoChats(demoChats);
}

function displayDemoChats(chats) {
    const chatList = document.getElementById('chatList');
    if (!chatList) return;
    
    chatList.innerHTML = '';
    
    chats.forEach((chat, index) => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.onclick = () => openDemoChat(chat);
        
        chatItem.innerHTML = `
            <div class="chat-item-avatar">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333808d'%3E%3Cpath d='M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9H21ZM12 17C8.69 17 6 14.31 6 11V9H18V11C18 14.31 15.31 17 12 17Z'/%3E%3C/svg%3E" alt="Avatar">
            </div>
            <div class="chat-item-info">
                <div class="chat-item-name">${chat.name} ${chat.hashtag}</div>
                <div class="chat-item-preview">${chat.lastMessage}</div>
            </div>
        `;
        
        chatList.appendChild(chatItem);
    });
}

function openDemoChat(chat) {
    currentChat = chat;
    
    // Update chat header
    const chatName = document.getElementById('chatName');
    const chatAvatar = document.getElementById('chatAvatar');
    const chatStatus = document.getElementById('chatStatus');
    
    if (chatName) chatName.textContent = chat.name;
    if (chatStatus) chatStatus.textContent = 'Online';
    if (chatAvatar) {
        chatAvatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333808d'%3E%3Cpath d='M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9H21ZM12 17C8.69 17 6 14.31 6 11V9H18V11C18 14.31 15.31 17 12 17Z'/%3E%3C/svg%3E";
    }
    
    // Update active chat
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Switch to chat view
    switchMainTab('chats');
    
    // Load demo messages
    loadDemoMessages();
    
    // Update wallpaper
    updateChatWallpaper();
}

function loadDemoMessages() {
    const demoMessages = [
        {
            senderId: 'other',
            senderName: currentChat.name,
            content: 'Hello! How are you today?',
            type: 'text',
            timestamp: Date.now() - 300000
        },
        {
            senderId: currentUser.uid,
            senderName: currentUser.profile.displayName,
            content: 'Hi there! I\'m doing great, thanks for asking!',
            type: 'text',
            timestamp: Date.now() - 240000
        },
        {
            senderId: 'other',
            senderName: currentChat.name,
            content: 'That\'s wonderful to hear! What are you up to?',
            type: 'text',
            timestamp: Date.now() - 180000
        }
    ];
    
    displayDemoMessages(demoMessages);
}

function displayDemoMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    messagesList.innerHTML = '';
    
    messages.forEach(messageData => {
        const messageElement = createMessageElement(messageData);
        messagesList.appendChild(messageElement);
    });
    
    // Scroll to bottom
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Navigation Setup
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.logout-btn')) return;
            
            const tab = item.dataset.tab;
            if (tab) {
                switchMainTab(tab);
            }
        });
    });
}

function switchMainTab(tab) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-tab="${tab}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    // Update mobile navigation
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeMobileNav = document.querySelector(`.mobile-nav-item[data-tab="${tab}"]`);
    if (activeMobileNav) {
        activeMobileNav.classList.add('active');
    }
    
    // Update content panels
    document.querySelectorAll('.content-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    
    const targetPanel = document.getElementById(tab + 'View');
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
    }
    
    // Load specific content
    if (tab === 'profile') {
        loadProfileData();
    } else if (tab === 'admin') {
        loadAdminData();
    } else if (tab === 'settings') {
        loadSettingsData();
    }
}

// Mobile Navigation
function setupMobileNavigation() {
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tab = item.dataset.tab;
            if (tab) {
                // Update mobile nav
                document.querySelectorAll('.mobile-nav-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                item.classList.add('active');
                
                switchMainTab(tab);
            }
        });
    });
}

// Load User Profile
function loadUserProfile() {
    if (!currentUser) return;
    
    // Update UI elements
    const nameEl = document.getElementById('currentUserName');
    const hashtagEl = document.getElementById('currentUserHashtag');
    
    if (nameEl) nameEl.textContent = currentUser.profile.displayName || currentUser.username;
    if (hashtagEl) hashtagEl.textContent = currentUser.profile.hashtag || `#${currentUser.username}`;
}

// Load Profile Data for Editing
function loadProfileData() {
    if (!currentUser) return;
    
    const usernameInput = document.getElementById('profileUsername');
    const hashtagInput = document.getElementById('profileHashtag');
    const bioInput = document.getElementById('profileBio');
    
    if (usernameInput) usernameInput.value = currentUser.username || '';
    if (hashtagInput) hashtagInput.value = currentUser.profile.hashtag || '';
    if (bioInput) bioInput.value = currentUser.profile.bio || '';
}

// Profile Management
function setupProfileListeners() {
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarChange);
    }
}

function changeAvatar() {
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.click();
    }
}

function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // For demo, just show a preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const profileAvatar = document.getElementById('profileAvatar');
        const currentAvatar = document.getElementById('currentUserAvatar');
        
        if (profileAvatar) profileAvatar.src = e.target.result;
        if (currentAvatar) currentAvatar.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateProfile() {
    if (!currentUser) return;
    
    const bioInput = document.getElementById('profileBio');
    const bio = bioInput ? bioInput.value : '';
    
    // Update user data
    currentUser.profile.bio = bio;
    demoUsers[currentUser.username].profile.bio = bio;
    
    alert('Profile updated successfully!');
}

// Settings Management
function setupSettingsListeners() {
    const wallpaperToggle = document.getElementById('wallpaperToggle');
    if (wallpaperToggle) {
        wallpaperToggle.addEventListener('change', toggleWallpaperEnabled);
    }
    
    document.querySelectorAll('.wallpaper-option').forEach(option => {
        option.addEventListener('click', selectWallpaper);
    });
}

function loadSettingsData() {
    updateWallpaperSettings();
}

function toggleWallpaperEnabled(e) {
    wallpapersEnabled = e.target.checked;
    localStorage.setItem('wallpapersEnabled', wallpapersEnabled);
    updateWallpaperSettings();
}

function selectWallpaper(e) {
    const wallpaper = e.currentTarget.dataset.wallpaper;
    currentWallpaper = wallpaper;
    localStorage.setItem('currentWallpaper', currentWallpaper);
    
    // Update UI
    document.querySelectorAll('.wallpaper-option').forEach(option => {
        option.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    updateChatWallpaper();
}

function updateWallpaperSettings() {
    const wallpaperToggle = document.getElementById('wallpaperToggle');
    const wallpaperOptions = document.getElementById('wallpaperOptions');
    
    if (wallpaperToggle) {
        wallpaperToggle.checked = wallpapersEnabled;
    }
    
    if (wallpaperOptions) {
        wallpaperOptions.classList.toggle('disabled', !wallpapersEnabled);
    }
    
    // Update active wallpaper
    document.querySelectorAll('.wallpaper-option').forEach(option => {
        option.classList.toggle('active', option.dataset.wallpaper === currentWallpaper);
    });
    
    updateChatWallpaper();
}

function updateChatWallpaper() {
    const chatWallpaper = document.querySelector('.chat-wallpaper');
    if (chatWallpaper) {
        if (wallpapersEnabled) {
            chatWallpaper.className = `chat-wallpaper ${currentWallpaper}`;
            chatWallpaper.style.display = 'block';
        } else {
            chatWallpaper.style.display = 'none';
        }
    }
}

function toggleWallpaper() {
    wallpapersEnabled = !wallpapersEnabled;
    localStorage.setItem('wallpapersEnabled', wallpapersEnabled);
    updateWallpaperSettings();
}

// Admin Panel
function loadAdminData() {
    if (!isAdmin) return;
    
    // Load all users from demo database
    const users = [];
    for (const [username, userData] of Object.entries(demoUsers)) {
        users.push({
            uid: username,
            username: username,
            name: userData.profile.displayName,
            hashtag: userData.profile.hashtag,
            role: userData.role
        });
    }
    
    displayUserManagement(users);
}

function displayUserManagement(users) {
    const userList = document.getElementById('userList');
    if (!userList) return;
    
    userList.innerHTML = '';
    
    users.forEach(userData => {
        const userItem = document.createElement('div');
        userItem.className = 'user-management-item';
        
        userItem.innerHTML = `
            <div class="user-management-info">
                <div class="user-avatar">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333808d'%3E%3Cpath d='M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9H21ZM12 17C8.69 17 6 14.31 6 11V9H18V11C18 14.31 15.31 17 12 17Z'/%3E%3C/svg%3E" alt="Avatar">
                </div>
                <div>
                    <div><strong>${userData.name}</strong> ${userData.hashtag}</div>
                    <div style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">Username: ${userData.username} | Role: ${userData.role}</div>
                </div>
            </div>
            <div class="user-management-actions">
                <button class="btn btn--sm btn--secondary" onclick="editUser('${userData.uid}', '${userData.name}', '${userData.hashtag}')">Edit</button>
            </div>
        `;
        
        userList.appendChild(userItem);
    });
}

function editUser(uid, currentName, currentHashtag) {
    const newName = prompt('Enter new display name:', currentName);
    const newHashtag = prompt('Enter new hashtag:', currentHashtag);
    
    if (newName && newHashtag) {
        // Update demo database
        if (demoUsers[uid]) {
            demoUsers[uid].profile.displayName = newName;
            demoUsers[uid].profile.hashtag = newHashtag;
            
            // If editing current user, update current session
            if (currentUser && currentUser.username === uid) {
                currentUser.profile.displayName = newName;
                currentUser.profile.hashtag = newHashtag;
                loadUserProfile();
            }
        }
        
        alert('User updated successfully!');
        loadAdminData();
    }
}

// Chat functions
function loadChats() {
    // Demo implementation - handled in setupDemoData
}

function startNewChat() {
    const availableUsers = [];
    for (const [username, userData] of Object.entries(demoUsers)) {
        if (username !== currentUser.username) {
            availableUsers.push({
                username: username,
                name: userData.profile.displayName,
                hashtag: userData.profile.hashtag
            });
        }
    }
    
    if (availableUsers.length === 0) {
        alert('No other users available to chat with.');
        return;
    }
    
    const userList = availableUsers.map(user => 
        `${user.name} (${user.hashtag})`
    ).join('\n');
    
    alert(`Available users to chat with:\n\n${userList}\n\nClick on any user in the chat list to start a conversation!`);
}

function closeUserSelectModal() {
    const modal = document.getElementById('userSelectModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Message functions
function createMessageElement(messageData) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.senderId === currentUser.uid ? 'own' : ''}`;
    
    const avatarSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333808d'%3E%3Cpath d='M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9H21ZM12 17C8.69 17 6 14.31 6 11V9H18V11C18 14.31 15.31 17 12 17Z'/%3E%3C/svg%3E";
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <img src="${avatarSrc}" alt="Avatar">
        </div>
        <div class="message-bubble">
            <div class="message-content">${messageData.content}</div>
            <div class="message-time">${formatTime(messageData.timestamp)}</div>
        </div>
    `;
    
    return messageDiv;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function handleMessageKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoResizeTextarea() {
    const textarea = document.getElementById('messageInput');
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    
    const content = messageInput.value.trim();
    if (!content || !currentChat) return;
    
    // Create new message
    const newMessage = {
        senderId: currentUser.uid,
        senderName: currentUser.profile.displayName,
        content: content,
        type: 'text',
        timestamp: Date.now()
    };
    
    // Add to message list
    const messagesList = document.getElementById('messagesList');
    if (messagesList) {
        const messageElement = createMessageElement(newMessage);
        messagesList.appendChild(messageElement);
        
        // Scroll to bottom
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // Clear input
    messageInput.value = '';
    autoResizeTextarea();
}

// Recording Functions - Demo implementations
function startVoiceRecording() {
    alert('Voice recording feature - demo mode! This would open the recording interface for voice notes.');
}

function startVideoRecording() {
    alert('Video recording feature - demo mode! This would open the recording interface for video notes.');
}

function startRecording() {
    console.log('Recording started');
}

function stopRecording() {
    console.log('Recording stopped');
}

function sendRecording() {
    alert('Recording sent!');
    cancelRecording();
}

function cancelRecording() {
    const modal = document.getElementById('recordingModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function playVoiceMessage(url) {
    console.log('Playing voice message:', url);
}

function playVideoMessage(url) {
    console.log('Playing video message:', url);
}

function logout() {
    currentUser = null;
    currentChat = null;
    showLoginPage();
}
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

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAe_ZfZ8rKCke47UeA9Kcs8cXpD6-G6RAQ",
    authDomain: "kiko-chat-b6435.firebaseapp.com",
    databaseURL: "https://kiko-chat-b6435-default-rtdb.firebaseio.com",
    projectId: "kiko-chat-b6435",
    storageBucket: "kiko-chat-b6435.appspot.com",
    messagingSenderId: "896370793240",
    appId: "1:896370793240:web:3f14442a5d80cd71fb1c6d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('KikoChat loading...');
    setupGlobalFunctions();
    loadUserSettings();
    setupEventListeners();
    setupFormHandlers();
    setupAnimations();
    
    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUser = {
                uid: user.uid,
                username: user.displayName || user.email.split('@')[0],
                email: user.email,
                profile: {
                    displayName: user.displayName || user.email.split('@')[0],
                    bio: '',
                    profilePic: user.photoURL || '',
                    hashtag: `#${user.email.split('@')[0]}`
                }
            };
            
            checkAdminStatus();
            showChatApp();
            loadChats();
        } else {
            // User is signed out
            showLoginPage();
        }
    });
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
    
    const email = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPasscode').value;
    
    console.log('Login attempt for email:', email);
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return false;
    }
    
    // Firebase authentication
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log('Login successful for:', user.email);
            
            // Get user data from database
            return database.ref('users/' + user.uid).once('value');
        })
        .then((snapshot) => {
            const userData = snapshot.val();
            
            currentUser = {
                uid: snapshot.key,
                username: userData.username,
                email: userData.email,
                role: userData.role || 'user',
                profile: userData.profile || {
                    displayName: userData.username,
                    bio: '',
                    profilePic: '',
                    hashtag: `#${userData.username}`
                }
            };
            
            checkAdminStatus();
            showChatApp();
            loadChats();
            
            // Clear form
            document.getElementById('loginForm').reset();
        })
        .catch((error) => {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        });
    
    return false;
}

function handleAdminCreateUser(e) {
    if (e) e.preventDefault();
    console.log('Admin create user form submitted');
    
    const adminEmail = document.getElementById('adminUsername').value.trim();
    const adminPassword = document.getElementById('adminPasscode').value;
    const newEmail = document.getElementById('adminCreateUsername').value.trim();
    const newPassword = document.getElementById('adminCreatePasscode').value;
    const newUsername = newEmail.split('@')[0];
    
    // First verify admin credentials
    auth.signInWithEmailAndPassword(adminEmail, adminPassword)
        .then((userCredential) => {
            // Check if user is admin
            return database.ref('users/' + userCredential.user.uid).once('value')
                .then((snapshot) => {
                    const userData = snapshot.val();
                    if (userData.role !== 'admin') {
                        throw new Error('User is not an admin');
                    }
                    
                    // Create new user
                    return auth.createUserWithEmailAndPassword(newEmail, newPassword);
                });
        })
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Create user profile in database
            const userProfile = {
                username: newUsername,
                email: newEmail,
                role: 'user',
                profile: {
                    displayName: newUsername,
                    bio: '',
                    profilePic: '',
                    hashtag: `#${newUsername}${Math.floor(Math.random() * 1000)}`
                }
            };
            
            return database.ref('users/' + user.uid).set(userProfile);
        })
        .then(() => {
            alert(`User "${newUsername}" created successfully!\nEmail: ${newEmail}\nPassword: ${newPassword}`);
            document.getElementById('adminForm').reset();
            
            // Sign back in as admin
            return auth.signInWithEmailAndPassword(adminEmail, adminPassword);
        })
        .then(() => {
            // Refresh admin panel if currently viewing it
            if (document.getElementById('adminView') && !document.getElementById('adminView').classList.contains('hidden')) {
                loadAdminData();
            }
        })
        .catch((error) => {
            console.error('Admin create user error:', error);
            alert('Error creating user: ' + error.message);
        });
    
    return false;
}

// Check if user is admin
function checkAdminStatus() {
    if (!currentUser) return;
    
    database.ref('users/' + currentUser.uid).once('value')
        .then((snapshot) => {
            const userData = snapshot.val();
            isAdmin = userData.role === 'admin';
            
            const adminNav = document.getElementById('adminNav');
            if (adminNav) {
                adminNav.style.display = isAdmin ? 'flex' : 'none';
            }
        });
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

// Load Chats from Firebase
function loadChats() {
    if (!currentUser) return;
    
    const chatList = document.getElementById('chatList');
    if (!chatList) return;
    
    chatList.innerHTML = '';
    
    // Get all users except current user
    database.ref('users').once('value')
        .then((snapshot) => {
            const users = [];
            snapshot.forEach((childSnapshot) => {
                if (childSnapshot.key !== currentUser.uid) {
                    const userData = childSnapshot.val();
                    users.push({
                        uid: childSnapshot.key,
                        username: userData.username,
                        name: userData.profile.displayName,
                        hashtag: userData.profile.hashtag
                    });
                }
            });
            
            // Display users as available chats
            displayChats(users);
        })
        .catch((error) => {
            console.error('Error loading chats:', error);
        });
}

function displayChats(chats) {
    const chatList = document.getElementById('chatList');
    if (!chatList) return;
    
    chatList.innerHTML = '';
    
    if (chats.length === 0) {
        chatList.innerHTML = '<div class="no-chats">No users available to chat with</div>';
        return;
    }
    
    chats.forEach((chat) => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.onclick = () => openChat(chat);
        
        chatItem.innerHTML = `
            <div class="chat-item-avatar">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333808d'%3E%3Cpath d='M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9H21ZM12 17C8.69 17 6 14.31 6 11V9H18V11C18 14.31 15.31 17 12 17Z'/%3E%3C/svg%3E" alt="Avatar">
            </div>
            <div class="chat-item-info">
                <div class="chat-item-name">${chat.name} ${chat.hashtag}</div>
                <div class="chat-item-preview">Click to start chatting!</div>
            </div>
        `;
        
        chatList.appendChild(chatItem);
    });
}

function openChat(chat) {
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
    
    // Switch to chat view
    switchMainTab('chats');
    
    // Load messages
    loadMessages();
    
    // Update wallpaper
    updateChatWallpaper();
}

function loadMessages() {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    messagesList.innerHTML = '';
    
    if (!currentChat) {
        messagesList.innerHTML = `
            <div class="welcome-message">
                <h3>Welcome to KikoChat!</h3>
                <p>Select a conversation from the left to start chatting.</p>
            </div>
        `;
        return;
    }
    
    // Get chat ID (combination of both user IDs, sorted)
    const chatId = [currentUser.uid, currentChat.uid].sort().join('_');
    
    // Listen for messages in this chat
    database.ref('chats/' + chatId + '/messages').orderByChild('timestamp').on('value', (snapshot) => {
        messagesList.innerHTML = '';
        
        if (!snapshot.exists()) {
            messagesList.innerHTML = `
                <div class="welcome-message">
                    <h3>Start a conversation with ${currentChat.name}</h3>
                    <p>Send a message to begin chatting!</p>
                </div>
            `;
            return;
        }
        
        const messages = [];
        snapshot.forEach((childSnapshot) => {
            messages.push(childSnapshot.val());
        });
        
        // Display messages
        displayMessages(messages);
        
        // Scroll to bottom
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    });
}

function displayMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    messages.forEach(messageData => {
        const messageElement = createMessageElement(messageData);
        messagesList.appendChild(messageElement);
    });
}

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

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !currentChat) return;
    
    const content = messageInput.value.trim();
    if (!content) return;
    
    // Get chat ID (combination of both user IDs, sorted)
    const chatId = [currentUser.uid, currentChat.uid].sort().join('_');
    
    // Create new message
    const newMessage = {
        senderId: currentUser.uid,
        senderName: currentUser.profile.displayName,
        content: content,
        type: 'text',
        timestamp: Date.now()
    };
    
    // Save to Firebase
    database.ref('chats/' + chatId + '/messages').push(newMessage)
        .then(() => {
            // Clear input
            messageInput.value = '';
            autoResizeTextarea();
        })
        .catch((error) => {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + error.message);
        });
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
    
    // Update user data in Firebase
    database.ref('users/' + currentUser.uid + '/profile/bio').set(bio)
        .then(() => {
            // Update local user data
            currentUser.profile.bio = bio;
            alert('Profile updated successfully!');
        })
        .catch((error) => {
            console.error('Error updating profile:', error);
            alert('Failed to update profile: ' + error.message);
        });
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
    
    // Load all users from Firebase
    database.ref('users').once('value')
        .then((snapshot) => {
            const users = [];
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                users.push({
                    uid: childSnapshot.key,
                    username: userData.username,
                    name: userData.profile.displayName,
                    hashtag: userData.profile.hashtag,
                    role: userData.role
                });
            });
            
            displayUserManagement(users);
        })
        .catch((error) => {
            console.error('Error loading admin data:', error);
        });
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
        // Update Firebase
        const updates = {};
        updates['users/' + uid + '/profile/displayName'] = newName;
        updates['users/' + uid + '/profile/hashtag'] = newHashtag;
        
        database.ref().update(updates)
            .then(() => {
                // If editing current user, update current session
                if (currentUser && currentUser.uid === uid) {
                    currentUser.profile.displayName = newName;
                    currentUser.profile.hashtag = newHashtag;
                    loadUserProfile();
                }
                
                alert('User updated successfully!');
                loadAdminData();
            })
            .catch((error) => {
                console.error('Error updating user:', error);
                alert('Failed to update user: ' + error.message);
            });
    }
}

// Chat functions
function startNewChat() {
    // Get all users except current user
    database.ref('users').once('value')
        .then((snapshot) => {
            const availableUsers = [];
            snapshot.forEach((childSnapshot) => {
                if (childSnapshot.key !== currentUser.uid) {
                    const userData = childSnapshot.val();
                    availableUsers.push({
                        uid: childSnapshot.key,
                        username: userData.username,
                        name: userData.profile.displayName,
                        hashtag: userData.profile.hashtag
                    });
                }
            });
            
            if (availableUsers.length === 0) {
                alert('No other users available to chat with.');
                return;
            }
            
            const userList = availableUsers.map(user => 
                `${user.name} (${user.hashtag})`
            ).join('\n');
            
            alert(`Available users to chat with:\n\n${userList}\n\nClick on any user in the chat list to start a conversation!`);
        })
        .catch((error) => {
            console.error('Error loading users:', error);
        });
}

function closeUserSelectModal() {
    const modal = document.getElementById('userSelectModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Message functions
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
    auth.signOut().then(() => {
        currentUser = null;
        currentChat = null;
        showLoginPage();
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

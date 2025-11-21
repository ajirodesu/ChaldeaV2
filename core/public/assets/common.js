let botData = null;
let selectedFiles = new Set();
let currentFilePath = '';

async function loadBotData() {
    try {
        const response = await fetch('/api/bot-info');
        botData = await response.json();
    } catch (error) {
        console.error('Failed to load bot data:', error);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        closeSidebar();
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    sidebar.classList.add('-translate-x-full');
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    setTimeout(() => overlay.classList.add('hidden'), 300);
    document.body.style.overflow = '';
}

async function restartBot() {
    if (!confirm('Are you sure you want to restart the bot? This will stop all current operations.')) return;

    try {
        const response = await fetch('/api/restart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        showNotification(data.message);
        // Optionally, disable UI or show loading
    } catch (error) {
        alert('Error restarting bot: ' + error.message);
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-6 right-6 bg-card border border-custom rounded-lg px-6 py-4 shadow-xl z-[70] card-shadow slide-in';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                <i class="fas fa-check text-green-400"></i>
            </div>
            <span class="text-sm font-medium">${message}</span>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateActiveNav(currentPage) {
    // Safely update nav links and titles. Some pages load shared includes asynchronously,
    // so guard against missing elements to avoid throwing errors that block page scripts.
    try {
        const links = document.querySelectorAll('.nav-link');
        if (links && links.length) {
            links.forEach(link => {
                link.classList.remove('bg-purple-600/20', 'text-purple-400');
                if (link.getAttribute('data-page') === currentPage) {
                    link.classList.add('bg-purple-600/20', 'text-purple-400');
                }
            });
        }

        const titles = {
            dashboard: 'Dashboard',
            commands: 'Commands',
            events: 'Events',
            tokens: 'Bot Tokens'
        };

        const pageTitleEl = document.getElementById('pageTitle');
        if (pageTitleEl) {
            pageTitleEl.textContent = titles[currentPage] || 'Dashboard';
        }

        const sidebarTitle = document.querySelector('.sidebar h1');
        if (sidebarTitle) {
            sidebarTitle.textContent = titles[currentPage] || 'Dashboard';
        }
    } catch (err) {
        // If anything unexpected happens, log and continue — avoid blocking page initialization.
        console.error('updateActiveNav error:', err);
    }
}

async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        const list = document.getElementById('notificationList');
        const badge = document.getElementById('notificationBadge');
        if (list && badge) {
            let read = JSON.parse(localStorage.getItem('readNotifications') || '[]');
            if (!Array.isArray(read)) read = [];
            const updates = data.updates;
            const unreadCount = updates.filter((_, i) => !read.includes(i)).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            list.innerHTML = '';
            if (updates.length === 0) {
                list.innerHTML = '<p class="px-4 py-3 text-secondary text-sm text-center">No updates available</p>';
            } else {
                updates.forEach((update, index) => {
                    const item = document.createElement('div');
                    item.className = 'px-4 py-3 border-b border-custom last:border-0 hover:bg-secondary transition-colors cursor-pointer';
                    if (read.includes(index)) {
                        item.classList.add('opacity-70');
                    }
                    item.innerHTML = `
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <h4 class="font-medium text-sm mb-1">${escapeHtml(update.title)}</h4>
                                <p class="text-xs text-secondary">${escapeHtml(update.message)}</p>
                            </div>
                            ${read.includes(index) ? '<i class="fas fa-check text-green-400 text-sm mt-1"></i>' : ''}
                        </div>
                    `;
                    item.addEventListener('click', () => markAsRead(index));
                    list.appendChild(item);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

function markAsRead(index) {
    let read = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!read.includes(index)) {
        read.push(index);
        localStorage.setItem('readNotifications', JSON.stringify(read));
    }
    loadNotifications();
}

function markAllAsRead() {
    const response = fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
            const updates = data.updates;
            const read = Array.from({length: updates.length}, (_, i) => i);
            localStorage.setItem('readNotifications', JSON.stringify(read));
            loadNotifications();
        });
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Hide context menu and notification dropdown on click outside
document.addEventListener('click', (e) => {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.classList.add('hidden');
    }
    const dropdown = document.getElementById('notificationDropdown');
    const button = e.target.closest('button[onclick="toggleNotifications()"]');
    if (!button && dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});
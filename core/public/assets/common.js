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
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-purple-600/20', 'text-purple-400');
        if (link.getAttribute('data-page') === currentPage) {
            link.classList.add('bg-purple-600/20', 'text-purple-400');
        }
    });

    const titles = {
        dashboard: 'Dashboard',
        commands: 'Commands',
        events: 'Events',
        files: 'File Manager',
        tokens: 'Bot Tokens'
    };
    document.getElementById('pageTitle').textContent = titles[currentPage] || 'Dashboard';

    const sidebarTitle = document.querySelector('.sidebar h1');
    if (sidebarTitle) {
        sidebarTitle.textContent = titles[currentPage] || 'Dashboard';
    }
}

// Hide context menu on click outside
document.addEventListener('click', () => {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.classList.add('hidden');
    }
});
// ===========================
// Configuration
// ===========================
const API_BASE = '/api/photos'; // Chemin vers les fichiers JSON
let currentPlayerData = null;
let currentCode = null;
let photosChart = null;

// ===========================
// Code Entry
// ===========================

// Auto-focus et navigation entre inputs
document.addEventListener('DOMContentLoaded', () => {
    setupCodeInputs();
    checkURLCode();
});

function setupCodeInputs() {
    const inputs = document.querySelectorAll('.code-input');

    inputs.forEach((input, index) => {
        // Auto-navigation forward
        input.addEventListener('input', (e) => {
            if (e.target.value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        // Auto-navigation backward
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }

            // Submit on Enter
            if (e.key === 'Enter') {
                submitCode();
            }
        });

        // Only allow letters and numbers
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    });
}

function checkURLCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && code.length === 6) {
        // Remplir les inputs
        for (let i = 0; i < 6; i++) {
            document.getElementById(`code${i+1}`).value = code[i];
        }
        // Soumettre automatiquement
        setTimeout(() => submitCode(), 500);
    }
}

async function submitCode() {
    const code = Array.from({length: 6}, (_, i) =>
        document.getElementById(`code${i+1}`).value
    ).join('').toUpperCase();

    if (code.length !== 6) {
        showError('ᴘʟᴇᴀsᴇ ᴇɴᴛᴇʀ ᴀ ᴠᴀʟɪᴅ 6-ᴄʜᴀʀᴀᴄᴛᴇʀ ᴄᴏᴅᴇ');
        return;
    }

    hideError();

    try {
        const data = await loadDataByCode(code);

        if (!data) {
            showError('❌ ɪɴᴠᴀʟɪᴅ ᴏʀ ᴇxᴘɪʀᴇᴅ ᴄᴏᴅᴇ');
            return;
        }

        // Vérifier expiration
        if (Date.now() > data.expiresAt) {
            showError('❌ ᴄᴏᴅᴇ ʜᴀs ᴇxᴘɪʀᴇᴅ');
            return;
        }

        currentPlayerData = data;
        currentCode = code;

        // Mettre à jour l'URL
        window.history.pushState({}, '', `?code=${code}`);

        // Afficher le profil
        showProfile(data);

    } catch (error) {
        console.error('Error:', error);
        showError('❌ ᴇʀʀᴏʀ ʟᴏᴀᴅɪɴɢ ᴅᴀᴛᴀ');
    }
}

async function loadDataByCode(code) {
    try {
        const response = await fetch(`${API_BASE}/codes/${code}.json`);

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to load data:', error);
        return null;
    }
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// ===========================
// Profile Display
// ===========================

function showProfile(data) {
    // Cacher le hero, afficher le profil
    document.querySelector('.hero').style.display = 'none';
    document.getElementById('profileSection').style.display = 'block';

    // Mettre à jour les infos joueur
    document.getElementById('playerAvatar').src = `https://crafatar.com/avatars/${data.uuid}?size=100&overlay`;
    document.getElementById('playerName').textContent = data.playerName;
    document.getElementById('playerUUID').textContent = `UUID: ${data.uuid.substring(0, 8)}...`;
    document.getElementById('currentCode').textContent = currentCode;
    document.getElementById('settingsCode').textContent = currentCode;

    // Date d'expiration
    const expiryDate = new Date(data.expiresAt);
    document.getElementById('expiryDate').textContent = expiryDate.toLocaleDateString('fr-FR');

    // Stats mini
    document.getElementById('photoCountMini').textContent = data.photoCount;
    document.getElementById('rideCountMini').textContent = data.photoCount; // Temporaire

    // Charger les photos
    loadPhotos(data.photos);

    // Charger les stats
    loadStats(data);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===========================
// Photos Tab
// ===========================

function loadPhotos(photos) {
    const grid = document.getElementById('photosGrid');
    const noPhotos = document.getElementById('noPhotos');

    grid.innerHTML = '';

    if (!photos || photos.length === 0) {
        noPhotos.style.display = 'block';
        return;
    }

    noPhotos.style.display = 'none';

    photos.forEach(photo => {
        const card = createPhotoCard(photo);
        grid.appendChild(card);
    });
}

function createPhotoCard(photo) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.onclick = () => openPhotoModal(photo);

    const img = document.createElement('img');
    img.src = photo.downloadUrl;
    img.alt = photo.rideName;
    img.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'photo-card-info';

    const title = document.createElement('div');
    title.className = 'photo-card-title';
    title.textContent = photo.rideName;

    const date = document.createElement('div');
    date.className = 'photo-card-date';
    date.textContent = new Date(photo.timestamp).toLocaleString('fr-FR');

    info.appendChild(title);
    info.appendChild(date);
    card.appendChild(img);
    card.appendChild(info);

    return card;
}

function openPhotoModal(photo) {
    const modal = document.getElementById('photoModal');
    document.getElementById('modalImage').src = photo.downloadUrl;
    document.getElementById('modalTitle').textContent = photo.rideName;
    document.getElementById('modalDate').textContent = new Date(photo.timestamp).toLocaleString('fr-FR');
    document.getElementById('modalDownload').href = photo.downloadUrl;
    document.getElementById('modalDownload').download = `${photo.playerName}_${photo.rideName}.png`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('photoModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function downloadAllPhotos() {
    if (!currentPlayerData || !currentPlayerData.photos) return;

    currentPlayerData.photos.forEach((photo, index) => {
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = photo.downloadUrl;
            a.download = `${photo.playerName}_${photo.rideName}.png`;
            a.click();
        }, index * 500); // Délai pour éviter le blocage
    });
}

// ===========================
// Stats Tab
// ===========================

function loadStats(data) {
    // Total photos
    document.getElementById('totalPhotos').textContent = data.photoCount;
    document.getElementById('totalRides').textContent = data.photoCount;

    // Favorite ride
    const rides = {};
    data.photos.forEach(photo => {
        rides[photo.rideName] = (rides[photo.rideName] || 0) + 1;
    });

    const favoriteRide = Object.keys(rides).reduce((a, b) => rides[a] > rides[b] ? a : b, 'N/A');
    document.getElementById('favoriteRide').textContent = favoriteRide;

    // Last visit
    if (data.photos.length > 0) {
        const lastPhoto = data.photos.reduce((latest, photo) =>
            photo.timestamp > latest.timestamp ? photo : latest
        );
        const lastVisitDate = new Date(lastPhoto.timestamp);
        document.getElementById('lastVisit').textContent = lastVisitDate.toLocaleDateString('fr-FR');
    }

    // Chart
    createPhotosChart(rides);
}

function createPhotosChart(rides) {
    const ctx = document.getElementById('photosChart');

    if (photosChart) {
        photosChart.destroy();
    }

    photosChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(rides),
            datasets: [{
                label: 'ᴘʜᴏᴛᴏs',
                data: Object.values(rides),
                backgroundColor: 'rgba(255, 140, 0, 0.5)',
                borderColor: 'rgba(255, 140, 0, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ===========================
// Tabs Navigation
// ===========================

function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.closest('.tab').classList.add('active');

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// ===========================
// Settings & Actions
// ===========================

function copyCode() {
    navigator.clipboard.writeText(currentCode).then(() => {
        alert('✅ ᴄᴏᴅᴇ ᴄᴏᴘɪᴇᴅ ᴛᴏ ᴄʟɪᴘʙᴏᴀʀᴅ!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

function shareProfile() {
    const url = `${window.location.origin}?code=${currentCode}`;

    if (navigator.share) {
        navigator.share({
            title: 'LandOfParks - My Profile',
            text: `Check out my photos from LandOfParks!`,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert('✅ ʟɪɴᴋ ᴄᴏᴘɪᴇᴅ ᴛᴏ ᴄʟɪᴘʙᴏᴀʀᴅ!');
        });
    }
}

function sharePhoto() {
    const photo = currentPlayerData.photos[0]; // Get current photo from modal

    if (navigator.share) {
        navigator.share({
            title: `LandOfParks - ${photo.rideName}`,
            text: `My photo from ${photo.rideName} at LandOfParks!`,
            url: photo.downloadUrl
        });
    } else {
        navigator.clipboard.writeText(photo.downloadUrl).then(() => {
            alert('✅ ᴘʜᴏᴛᴏ ʟɪɴᴋ ᴄᴏᴘɪᴇᴅ!');
        });
    }
}

async function refreshData() {
    if (!currentCode) return;

    try {
        const data = await loadDataByCode(currentCode);
        if (data) {
            currentPlayerData = data;
            showProfile(data);
            alert('✅ ᴅᴀᴛᴀ ʀᴇғʀᴇsʜᴇᴅ!');
        }
    } catch (error) {
        alert('❌ ғᴀɪʟᴇᴅ ᴛᴏ ʀᴇғʀᴇsʜ ᴅᴀᴛᴀ');
    }
}

function logout() {
    if (confirm('ᴀʀᴇ ʏᴏᴜ sᴜʀᴇ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ʟᴏɢᴏᴜᴛ?')) {
        currentPlayerData = null;
        currentCode = null;

        document.querySelector('.hero').style.display = 'block';
        document.getElementById('profileSection').style.display = 'none';

        // Clear inputs
        for (let i = 1; i <= 6; i++) {
            document.getElementById(`code${i}`).value = '';
        }

        // Update URL
        window.history.pushState({}, '', window.location.pathname);

        // Focus first input
        document.getElementById('code1').focus();
    }
}

// ===========================
// Keyboard Shortcuts
// ===========================

document.addEventListener('keydown', (e) => {
    // ESC to close modal
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ===========================
// Service Worker (Optional)
// ===========================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable offline support
        // navigator.serviceWorker.register('/sw.js');
    });
}


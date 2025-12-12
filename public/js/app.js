// ================================
// État de l'application
// ================================
let bugs = [];
let currentUser = 'bob';
let currentView = 'list';
let filters = {
    status: 'all',
    priority: 'all',
    severity: 'all',
    assignee: 'all',
    search: ''
};
let sortBy = 'created_desc';

// ================================
// Constantes
// ================================
const API_URL = '/api';

const USERS = {
    alice: { name: 'Alice Martin', role: 'Dev', avatar: '👩‍💻' },
    bob: { name: 'Bob Dupont', role: 'QA', avatar: '🧪' },
    charlie: { name: 'Charlie Durand', role: 'Lead', avatar: '👨‍💼' }
};

const STATUS_LABELS = {
    open: '🔴 Ouvert',
    in_progress: '🟡 En cours',
    resolved: '🟢 Résolu',
    closed: '⚫ Fermé',
    reopened: '🟠 Réouvert'
};

const PRIORITY_LABELS = {
    critical: '🔥 Critique',
    high: '⬆️ Haute',
    medium: '➡️ Moyenne',
    low: '⬇️ Basse'
};

const SEVERITY_LABELS = {
    blocker: 'Bloquant',
    major: 'Majeur',
    minor: 'Mineur',
    trivial: 'Trivial'
};

// Transitions de statut autorisées
const STATUS_TRANSITIONS = {
    open: ['in_progress', 'closed'],
    in_progress: ['resolved', 'open'],
    resolved: ['closed', 'reopened'],
    closed: ['reopened'],
    reopened: ['in_progress', 'closed']
};

// ================================
// Éléments DOM
// ================================
const elements = {
    userSelect: document.getElementById('current-user'),
    filterStatus: document.getElementById('filter-status'),
    filterPriority: document.getElementById('filter-priority'),
    filterSeverity: document.getElementById('filter-severity'),
    filterAssignee: document.getElementById('filter-assignee'),
    filterSearch: document.getElementById('filter-search'),
    clearFilters: document.getElementById('clear-filters'),
    sortBy: document.getElementById('sort-by'),
    newBugBtn: document.getElementById('new-bug-btn'),
    bugList: document.getElementById('list-view'),
    bugBoard: document.getElementById('board-view'),
    emptyState: document.getElementById('empty-state'),
    bugModal: document.getElementById('bug-modal'),
    bugForm: document.getElementById('bug-form'),
    modalTitle: document.getElementById('modal-title'),
    detailModal: document.getElementById('detail-modal'),
    detailContent: document.getElementById('detail-content'),
    toastContainer: document.getElementById('toast-container'),
    viewBtns: document.querySelectorAll('.view-btn'),
    // Stats
    statTotal: document.getElementById('stat-total'),
    statOpen: document.getElementById('stat-open'),
    statProgress: document.getElementById('stat-progress'),
    statResolved: document.getElementById('stat-resolved')
};

// ================================
// Initialisation
// ================================
document.addEventListener('DOMContentLoaded', () => {
    loadBugs();
    setupEventListeners();
});

function setupEventListeners() {
    // Utilisateur
    elements.userSelect.addEventListener('change', (e) => {
        currentUser = e.target.value;
        showToast(`Connecté en tant que ${USERS[currentUser].name}`, 'info');
    });

    // Filtres
    elements.filterStatus.addEventListener('change', () => {
        filters.status = elements.filterStatus.value;
        renderBugs();
    });

    elements.filterPriority.addEventListener('change', () => {
        filters.priority = elements.filterPriority.value;
        renderBugs();
    });

    elements.filterSeverity.addEventListener('change', () => {
        filters.severity = elements.filterSeverity.value;
        renderBugs();
    });

    elements.filterAssignee.addEventListener('change', () => {
        filters.assignee = elements.filterAssignee.value;
        renderBugs();
    });

    elements.filterSearch.addEventListener('input', debounce(() => {
        filters.search = elements.filterSearch.value.toLowerCase();
        renderBugs();
    }, 300));

    elements.clearFilters.addEventListener('click', clearFilters);

    // Tri
    elements.sortBy.addEventListener('change', () => {
        sortBy = elements.sortBy.value;
        renderBugs();
    });

    // Vue
    elements.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderBugs();
        });
    });

    // Nouveau bug
    elements.newBugBtn.addEventListener('click', () => openBugModal());

    // Modal bug
    elements.bugForm.addEventListener('submit', handleBugSubmit);
    document.getElementById('cancel-btn').addEventListener('click', closeBugModal);
    document.querySelector('[data-testid="modal-close"]').addEventListener('click', closeBugModal);

    // Modal détail
    document.querySelector('[data-testid="detail-close"]').addEventListener('click', closeDetailModal);

    // Fermer modals en cliquant à l'extérieur
    elements.bugModal.addEventListener('click', (e) => {
        if (e.target === elements.bugModal) closeBugModal();
    });

    elements.detailModal.addEventListener('click', (e) => {
        if (e.target === elements.detailModal) closeDetailModal();
    });

    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBugModal();
            closeDetailModal();
        }
        if (e.key === 'n' && e.ctrlKey) {
            e.preventDefault();
            openBugModal();
        }
    });
}

// ================================
// API Functions
// ================================
async function loadBugs() {
    try {
        const response = await fetch(`${API_URL}/bugs`);
        if (!response.ok) throw new Error('Erreur de chargement');
        bugs = await response.json();
        renderBugs();
        updateStats();
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Impossible de charger les bugs', 'error');
    }
}

async function createBug(bugData) {
    try {
        const response = await fetch(`${API_URL}/bugs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...bugData, reporter: currentUser })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur de création');
        }

        const newBug = await response.json();
        bugs.push(newBug);
        renderBugs();
        updateStats();
        showToast('Bug créé avec succès', 'success');
        return newBug;
    } catch (error) {
        console.error('Erreur:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

async function updateBug(id, updates) {
    try {
        const response = await fetch(`${API_URL}/bugs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur de mise à jour');
        }

        const updatedBug = await response.json();
        const index = bugs.findIndex(b => b.id === id);
        if (index !== -1) bugs[index] = updatedBug;
        renderBugs();
        updateStats();
        showToast('Bug mis à jour', 'success');
        return updatedBug;
    } catch (error) {
        console.error('Erreur:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

async function deleteBug(id) {
    try {
        const response = await fetch(`${API_URL}/bugs/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erreur de suppression');

        bugs = bugs.filter(b => b.id !== id);
        renderBugs();
        updateStats();
        showToast('Bug supprimé', 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Impossible de supprimer le bug', 'error');
    }
}

async function updateBugStatus(id, newStatus) {
    const bug = bugs.find(b => b.id === id);
    if (!bug) return;

    const allowedTransitions = STATUS_TRANSITIONS[bug.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
        showToast(`Transition de ${bug.status} vers ${newStatus} non autorisée`, 'warning');
        return;
    }

    await updateBug(id, { status: newStatus });
}

async function addComment(bugId, text) {
    try {
        const response = await fetch(`${API_URL}/bugs/${bugId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, author: currentUser })
        });

        if (!response.ok) throw new Error('Erreur');

        const updatedBug = await response.json();
        const index = bugs.findIndex(b => b.id === bugId);
        if (index !== -1) bugs[index] = updatedBug;

        showToast('Commentaire ajouté', 'success');
        return updatedBug;
    } catch (error) {
        showToast('Impossible d\'ajouter le commentaire', 'error');
    }
}

// ================================
// Filtrage et Tri
// ================================
function getFilteredBugs() {
    return bugs.filter(bug => {
        if (filters.status !== 'all' && bug.status !== filters.status) return false;
        if (filters.priority !== 'all' && bug.priority !== filters.priority) return false;
        if (filters.severity !== 'all' && bug.severity !== filters.severity) return false;

        if (filters.assignee !== 'all') {
            if (filters.assignee === 'unassigned' && bug.assignee) return false;
            if (filters.assignee !== 'unassigned' && bug.assignee !== filters.assignee) return false;
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchTitle = bug.title.toLowerCase().includes(searchLower);
            const matchDesc = bug.description.toLowerCase().includes(searchLower);
            const matchId = bug.id.toLowerCase().includes(searchLower);
            if (!matchTitle && !matchDesc && !matchId) return false;
        }

        return true;
    });
}

function getSortedBugs(bugList) {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    return [...bugList].sort((a, b) => {
        switch (sortBy) {
            case 'created_desc':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'created_asc':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'priority':
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'updated':
                return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
            default:
                return 0;
        }
    });
}

function clearFilters() {
    filters = { status: 'all', priority: 'all', severity: 'all', assignee: 'all', search: '' };
    elements.filterStatus.value = 'all';
    elements.filterPriority.value = 'all';
    elements.filterSeverity.value = 'all';
    elements.filterAssignee.value = 'all';
    elements.filterSearch.value = '';
    renderBugs();
    showToast('Filtres réinitialisés', 'info');
}

// ================================
// Rendu
// ================================
function renderBugs() {
    const filteredBugs = getSortedBugs(getFilteredBugs());

    if (currentView === 'list') {
        renderListView(filteredBugs);
    } else {
        renderBoardView(filteredBugs);
    }

    // Toggle empty state
    const isEmpty = filteredBugs.length === 0;
    elements.emptyState.classList.toggle('hidden', !isEmpty);
    elements.bugList.classList.toggle('hidden', currentView !== 'list' || isEmpty);
    elements.bugBoard.classList.toggle('hidden', currentView !== 'board' || isEmpty);
}

function renderListView(bugList) {
    elements.bugList.innerHTML = bugList.map(bug => `
        <div class="bug-card" data-testid="bug-card" data-id="${bug.id}" onclick="openDetailModal('${bug.id}')">
            <div class="bug-card-header">
                <span class="bug-id" data-testid="bug-id">${bug.id}</span>
                <div class="bug-actions" onclick="event.stopPropagation()">
                    <button class="btn-icon" onclick="openBugModal('${bug.id}')" title="Modifier" data-testid="edit-btn">✏️</button>
                    <button class="btn-icon" onclick="confirmDelete('${bug.id}')" title="Supprimer" data-testid="delete-btn">🗑️</button>
                </div>
            </div>
            <h3 class="bug-title" data-testid="bug-title">${escapeHtml(bug.title)}</h3>
            <div class="bug-meta">
                <span class="badge badge-${bug.status}" data-testid="bug-status">${STATUS_LABELS[bug.status]}</span>
                <span class="badge badge-${bug.priority}" data-testid="bug-priority-badge">${PRIORITY_LABELS[bug.priority]}</span>
                <span class="badge badge-${bug.severity}" data-testid="bug-severity-badge">${SEVERITY_LABELS[bug.severity]}</span>
            </div>
            <div class="bug-footer">
                <span class="bug-assignee" data-testid="bug-assignee">
                    ${bug.assignee ? `${USERS[bug.assignee]?.avatar || '👤'} ${USERS[bug.assignee]?.name || bug.assignee}` : '👤 Non assigné'}
                </span>
                <span class="bug-date" data-testid="bug-date">${formatDate(bug.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

function renderBoardView(bugList) {
    const columns = {
        open: [],
        in_progress: [],
        resolved: [],
        closed: []
    };

    bugList.forEach(bug => {
        const status = bug.status === 'reopened' ? 'open' : bug.status;
        if (columns[status]) columns[status].push(bug);
    });

    Object.entries(columns).forEach(([status, bugs]) => {
        const columnEl = document.querySelector(`[data-testid="column-${status === 'in_progress' ? 'progress' : status}"]`);
        if (!columnEl) return;

        columnEl.innerHTML = bugs.map(bug => `
            <div class="board-card" data-testid="board-card" data-id="${bug.id}" onclick="openDetailModal('${bug.id}')">
                <span class="bug-id">${bug.id}</span>
                <h4 class="bug-title">${escapeHtml(bug.title)}</h4>
                <div class="bug-meta">
                    <span class="badge badge-${bug.priority}">${PRIORITY_LABELS[bug.priority]}</span>
                </div>
                <span class="bug-assignee">
                    ${bug.assignee ? USERS[bug.assignee]?.avatar || '👤' : '👤'}
                </span>
            </div>
        `).join('');
    });
}

function updateStats() {
    const total = bugs.length;
    const open = bugs.filter(b => b.status === 'open' || b.status === 'reopened').length;
    const inProgress = bugs.filter(b => b.status === 'in_progress').length;
    const resolved = bugs.filter(b => b.status === 'resolved').length;

    elements.statTotal.textContent = total;
    elements.statOpen.textContent = open;
    elements.statProgress.textContent = inProgress;
    elements.statResolved.textContent = resolved;
}

// ================================
// Modals
// ================================
function openBugModal(bugId = null) {
    const form = elements.bugForm;
    form.reset();

    if (bugId) {
        const bug = bugs.find(b => b.id === bugId);
        if (!bug) return;

        elements.modalTitle.textContent = `Modifier ${bug.id}`;
        form.elements.id.value = bug.id;
        form.elements.title.value = bug.title;
        form.elements.priority.value = bug.priority;
        form.elements.severity.value = bug.severity;
        form.elements.assignee.value = bug.assignee || '';
        form.elements.environment.value = bug.environment || 'production';
        form.elements.description.value = bug.description;
        form.elements.steps.value = bug.steps || '';
        form.elements.expected.value = bug.expected || '';
        form.elements.actual.value = bug.actual || '';
    } else {
        elements.modalTitle.textContent = 'Nouveau Bug';
        form.elements.id.value = '';
    }

    elements.bugModal.classList.remove('hidden');
    form.elements.title.focus();
}

function closeBugModal() {
    elements.bugModal.classList.add('hidden');
    elements.bugForm.reset();
}

async function handleBugSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const bugData = {
        title: form.elements.title.value.trim(),
        priority: form.elements.priority.value,
        severity: form.elements.severity.value,
        assignee: form.elements.assignee.value || null,
        environment: form.elements.environment.value,
        description: form.elements.description.value.trim(),
        steps: form.elements.steps.value.trim() || null,
        expected: form.elements.expected.value.trim() || null,
        actual: form.elements.actual.value.trim() || null
    };

    const bugId = form.elements.id.value;

    try {
        if (bugId) {
            await updateBug(bugId, bugData);
        } else {
            await createBug(bugData);
        }
        closeBugModal();
    } catch (error) {
        // Erreur déjà gérée dans les fonctions API
    }
}

function openDetailModal(bugId) {
    const bug = bugs.find(b => b.id === bugId);
    if (!bug) return;

    const allowedTransitions = STATUS_TRANSITIONS[bug.status] || [];

    elements.detailContent.innerHTML = `
        <div class="detail-header">
            <span class="bug-id" data-testid="detail-bug-id">${bug.id}</span>
            <h3 data-testid="detail-title">${escapeHtml(bug.title)}</h3>
            <div class="detail-badges">
                <span class="badge badge-${bug.status}">${STATUS_LABELS[bug.status]}</span>
                <span class="badge badge-${bug.priority}">${PRIORITY_LABELS[bug.priority]}</span>
                <span class="badge badge-${bug.severity}">${SEVERITY_LABELS[bug.severity]}</span>
            </div>
        </div>

        <div class="detail-grid">
            <div class="detail-item">
                <label>Rapporteur</label>
                <span>${USERS[bug.reporter]?.name || bug.reporter}</span>
            </div>
            <div class="detail-item">
                <label>Assigné à</label>
                <span>${bug.assignee ? USERS[bug.assignee]?.name : 'Non assigné'}</span>
            </div>
            <div class="detail-item">
                <label>Environnement</label>
                <span>${bug.environment || 'Non spécifié'}</span>
            </div>
            <div class="detail-item">
                <label>Créé le</label>
                <span>${formatDateTime(bug.createdAt)}</span>
            </div>
        </div>

        <div class="detail-section">
            <h4>Description</h4>
            <p data-testid="detail-description">${escapeHtml(bug.description)}</p>
        </div>

        ${bug.steps ? `
        <div class="detail-section">
            <h4>Étapes de reproduction</h4>
            <p>${escapeHtml(bug.steps)}</p>
        </div>
        ` : ''}

        ${bug.expected || bug.actual ? `
        <div class="detail-grid">
            ${bug.expected ? `
            <div class="detail-section">
                <h4>Comportement attendu</h4>
                <p>${escapeHtml(bug.expected)}</p>
            </div>
            ` : ''}
            ${bug.actual ? `
            <div class="detail-section">
                <h4>Comportement actuel</h4>
                <p>${escapeHtml(bug.actual)}</p>
            </div>
            ` : ''}
        </div>
        ` : ''}

        <div class="detail-actions">
            <div class="status-actions" data-testid="status-actions">
                ${allowedTransitions.map(status => `
                    <button class="btn btn-sm btn-secondary" onclick="changeStatus('${bug.id}', '${status}')" data-testid="status-btn-${status}">
                        ${STATUS_LABELS[status]}
                    </button>
                `).join('')}
            </div>
            <button class="btn btn-sm btn-primary" onclick="openBugModal('${bug.id}'); closeDetailModal();" data-testid="edit-from-detail">
                ✏️ Modifier
            </button>
            <button class="btn btn-sm btn-danger" onclick="confirmDelete('${bug.id}'); closeDetailModal();" data-testid="delete-from-detail">
                🗑️ Supprimer
            </button>
        </div>

        <div class="comments-section" data-testid="comments-section">
            <h4>💬 Commentaires (${bug.comments?.length || 0})</h4>
            <div class="comments-list" data-testid="comments-list">
                ${(bug.comments || []).map(comment => `
                    <div class="comment" data-testid="comment">
                        <div class="comment-header">
                            <span class="comment-author">${USERS[comment.author]?.name || comment.author}</span>
                            <span class="comment-date">${formatDateTime(comment.createdAt)}</span>
                        </div>
                        <p class="comment-text">${escapeHtml(comment.text)}</p>
                    </div>
                `).join('')}
            </div>
            <div class="add-comment">
                <input type="text" id="new-comment" placeholder="Ajouter un commentaire..." data-testid="comment-input">
                <button class="btn btn-primary btn-sm" onclick="submitComment('${bug.id}')" data-testid="submit-comment">
                    Envoyer
                </button>
            </div>
        </div>
    `;

    elements.detailModal.classList.remove('hidden');
}

function closeDetailModal() {
    elements.detailModal.classList.add('hidden');
}

async function changeStatus(bugId, newStatus) {
    await updateBugStatus(bugId, newStatus);
    openDetailModal(bugId); // Rafraîchir le modal
}

async function submitComment(bugId) {
    const input = document.getElementById('new-comment');
    const text = input.value.trim();

    if (!text) {
        showToast('Le commentaire ne peut pas être vide', 'warning');
        return;
    }

    await addComment(bugId, text);
    openDetailModal(bugId); // Rafraîchir
}

function confirmDelete(bugId) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le bug ${bugId} ?`)) {
        deleteBug(bugId);
    }
}

// ================================
// Utilitaires
// ================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('data-testid', 'toast');
    toast.innerHTML = `
        <span>${message}</span>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Exposer les fonctions pour les event handlers inline
window.openDetailModal = openDetailModal;
window.openBugModal = openBugModal;
window.confirmDelete = confirmDelete;
window.changeStatus = changeStatus;
window.submitComment = submitComment;

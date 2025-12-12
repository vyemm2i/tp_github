const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ================================
// Base de données en mémoire
// ================================
let bugIdCounter = 6;

let bugs = [
    {
        id: 'BUG-001',
        title: 'Erreur 500 sur la page de connexion',
        description: 'Quand on essaie de se connecter avec un email contenant un "+", le serveur renvoie une erreur 500.',
        priority: 'critical',
        severity: 'blocker',
        status: 'open',
        reporter: 'bob',
        assignee: 'alice',
        environment: 'production',
        steps: '1. Aller sur /login\n2. Entrer email: test+1@example.com\n3. Entrer mot de passe valide\n4. Cliquer sur Connexion',
        expected: 'L\'utilisateur est connecté et redirigé vers le dashboard',
        actual: 'Page blanche avec erreur 500',
        comments: [
            { id: 1, author: 'alice', text: 'Je regarde ça ce matin', createdAt: '2024-01-15T09:30:00Z' },
            { id: 2, author: 'bob', text: 'Merci ! C\'est urgent car ça bloque plusieurs clients', createdAt: '2024-01-15T09:45:00Z' }
        ],
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T09:45:00Z'
    },
    {
        id: 'BUG-002',
        title: 'Le bouton "Exporter CSV" ne fonctionne pas sur Safari',
        description: 'Le téléchargement ne se déclenche pas quand on clique sur le bouton d\'export en utilisant Safari.',
        priority: 'high',
        severity: 'major',
        status: 'in_progress',
        reporter: 'charlie',
        assignee: 'alice',
        environment: 'production',
        steps: '1. Ouvrir Safari\n2. Aller sur la page des rapports\n3. Cliquer sur "Exporter CSV"',
        expected: 'Un fichier CSV est téléchargé',
        actual: 'Rien ne se passe, pas de téléchargement',
        comments: [
            { id: 1, author: 'alice', text: 'Problème de blob URL sur Safari, je travaille sur un fix', createdAt: '2024-01-14T14:00:00Z' }
        ],
        createdAt: '2024-01-14T10:00:00Z',
        updatedAt: '2024-01-14T14:00:00Z'
    },
    {
        id: 'BUG-003',
        title: 'Fuite mémoire dans le composant Dashboard',
        description: 'La mémoire augmente progressivement quand le dashboard reste ouvert. Après 30 minutes, l\'onglet consomme plus de 2GB.',
        priority: 'high',
        severity: 'major',
        status: 'open',
        reporter: 'alice',
        assignee: null,
        environment: 'staging',
        steps: '1. Ouvrir le dashboard\n2. Laisser l\'onglet ouvert pendant 30 minutes\n3. Observer la consommation mémoire dans le gestionnaire des tâches',
        expected: 'La mémoire reste stable',
        actual: 'La mémoire augmente de ~50MB par minute',
        comments: [],
        createdAt: '2024-01-13T16:00:00Z',
        updatedAt: '2024-01-13T16:00:00Z'
    },
    {
        id: 'BUG-004',
        title: 'Traduction manquante sur la page de profil',
        description: 'Plusieurs labels ne sont pas traduits en français sur la page de profil utilisateur.',
        priority: 'low',
        severity: 'minor',
        status: 'resolved',
        reporter: 'bob',
        assignee: 'charlie',
        environment: 'staging',
        steps: '1. Changer la langue en Français\n2. Aller sur la page Profil\n3. Observer les labels',
        expected: 'Tous les textes sont en français',
        actual: 'Les labels "Email preferences", "Notification settings" sont en anglais',
        comments: [
            { id: 1, author: 'charlie', text: 'Corrigé dans PR #234', createdAt: '2024-01-12T11:00:00Z' }
        ],
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-12T11:00:00Z'
    },
    {
        id: 'BUG-005',
        title: 'Icône de notification mal alignée sur mobile',
        description: 'Sur les écrans < 375px, l\'icône de notification dans le header déborde de son conteneur.',
        priority: 'low',
        severity: 'trivial',
        status: 'closed',
        reporter: 'bob',
        assignee: 'alice',
        environment: 'production',
        steps: '1. Ouvrir sur un iPhone SE\n2. Regarder le header',
        expected: 'L\'icône est bien centrée dans son cercle',
        actual: 'L\'icône déborde légèrement à droite',
        comments: [],
        createdAt: '2024-01-08T14:00:00Z',
        updatedAt: '2024-01-09T10:00:00Z'
    }
];

// ================================
// Utilitaires
// ================================
function generateBugId() {
    return `BUG-${String(bugIdCounter++).padStart(3, '0')}`;
}

function validateBug(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate || data.title !== undefined) {
        if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
            errors.push('Le titre est requis');
        } else if (data.title.length > 200) {
            errors.push('Le titre ne peut pas dépasser 200 caractères');
        }
    }

    if (!isUpdate || data.priority !== undefined) {
        const validPriorities = ['critical', 'high', 'medium', 'low'];
        if (!isUpdate && !data.priority) {
            errors.push('La priorité est requise');
        } else if (data.priority && !validPriorities.includes(data.priority)) {
            errors.push('Priorité invalide');
        }
    }

    if (!isUpdate || data.severity !== undefined) {
        const validSeverities = ['blocker', 'major', 'minor', 'trivial'];
        if (!isUpdate && !data.severity) {
            errors.push('La sévérité est requise');
        } else if (data.severity && !validSeverities.includes(data.severity)) {
            errors.push('Sévérité invalide');
        }
    }

    if (!isUpdate || data.description !== undefined) {
        if (!isUpdate && (!data.description || data.description.trim() === '')) {
            errors.push('La description est requise');
        }
    }

    if (data.status !== undefined) {
        const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'reopened'];
        if (!validStatuses.includes(data.status)) {
            errors.push('Statut invalide');
        }
    }

    if (data.environment !== undefined) {
        const validEnvironments = ['production', 'staging', 'development'];
        if (!validEnvironments.includes(data.environment)) {
            errors.push('Environnement invalide');
        }
    }

    return errors;
}

// ================================
// Routes API
// ================================

// GET /api/bugs - Liste tous les bugs
app.get('/api/bugs', (req, res) => {
    let result = [...bugs];

    // Filtrage
    const { status, priority, severity, assignee, search } = req.query;

    if (status && status !== 'all') {
        result = result.filter(b => b.status === status);
    }

    if (priority && priority !== 'all') {
        result = result.filter(b => b.priority === priority);
    }

    if (severity && severity !== 'all') {
        result = result.filter(b => b.severity === severity);
    }

    if (assignee) {
        if (assignee === 'unassigned') {
            result = result.filter(b => !b.assignee);
        } else if (assignee !== 'all') {
            result = result.filter(b => b.assignee === assignee);
        }
    }

    if (search) {
        const searchLower = search.toLowerCase();
        result = result.filter(b =>
            b.title.toLowerCase().includes(searchLower) ||
            b.description.toLowerCase().includes(searchLower) ||
            b.id.toLowerCase().includes(searchLower)
        );
    }

    res.json(result);
});

// GET /api/bugs/:id - Récupère un bug par ID
app.get('/api/bugs/:id', (req, res) => {
    const bug = bugs.find(b => b.id === req.params.id);

    if (!bug) {
        return res.status(404).json({ error: 'Bug non trouvé' });
    }

    res.json(bug);
});

// POST /api/bugs - Crée un nouveau bug
app.post('/api/bugs', (req, res) => {
    const errors = validateBug(req.body);

    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(', ') });
    }

    const {
        title,
        description,
        priority,
        severity,
        assignee,
        environment,
        steps,
        expected,
        actual,
        reporter
    } = req.body;

    const newBug = {
        id: generateBugId(),
        title: title.trim(),
        description: description.trim(),
        priority,
        severity,
        status: 'open',
        reporter: reporter || 'anonymous',
        assignee: assignee || null,
        environment: environment || 'production',
        steps: steps?.trim() || null,
        expected: expected?.trim() || null,
        actual: actual?.trim() || null,
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    bugs.push(newBug);
    res.status(201).json(newBug);
});

// PUT /api/bugs/:id - Met à jour un bug
app.put('/api/bugs/:id', (req, res) => {
    const bugIndex = bugs.findIndex(b => b.id === req.params.id);

    if (bugIndex === -1) {
        return res.status(404).json({ error: 'Bug non trouvé' });
    }

    const errors = validateBug(req.body, true);

    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(', ') });
    }

    const bug = bugs[bugIndex];
    const allowedFields = ['title', 'description', 'priority', 'severity', 'status', 'assignee', 'environment', 'steps', 'expected', 'actual'];

    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            bug[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
        }
    });

    bug.updatedAt = new Date().toISOString();

    res.json(bug);
});

// DELETE /api/bugs/:id - Supprime un bug
app.delete('/api/bugs/:id', (req, res) => {
    const bugIndex = bugs.findIndex(b => b.id === req.params.id);

    if (bugIndex === -1) {
        return res.status(404).json({ error: 'Bug non trouvé' });
    }

    bugs.splice(bugIndex, 1);
    res.status(204).send();
});

// POST /api/bugs/:id/comments - Ajoute un commentaire
app.post('/api/bugs/:id/comments', (req, res) => {
    const bug = bugs.find(b => b.id === req.params.id);

    if (!bug) {
        return res.status(404).json({ error: 'Bug non trouvé' });
    }

    const { text, author } = req.body;

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Le texte du commentaire est requis' });
    }

    const comment = {
        id: (bug.comments?.length || 0) + 1,
        author: author || 'anonymous',
        text: text.trim(),
        createdAt: new Date().toISOString()
    };

    bug.comments = bug.comments || [];
    bug.comments.push(comment);
    bug.updatedAt = new Date().toISOString();

    res.status(201).json(bug);
});

// GET /api/stats - Statistiques
app.get('/api/stats', (req, res) => {
    const stats = {
        total: bugs.length,
        byStatus: {
            open: bugs.filter(b => b.status === 'open').length,
            in_progress: bugs.filter(b => b.status === 'in_progress').length,
            resolved: bugs.filter(b => b.status === 'resolved').length,
            closed: bugs.filter(b => b.status === 'closed').length,
            reopened: bugs.filter(b => b.status === 'reopened').length
        },
        byPriority: {
            critical: bugs.filter(b => b.priority === 'critical').length,
            high: bugs.filter(b => b.priority === 'high').length,
            medium: bugs.filter(b => b.priority === 'medium').length,
            low: bugs.filter(b => b.priority === 'low').length
        },
        bySeverity: {
            blocker: bugs.filter(b => b.severity === 'blocker').length,
            major: bugs.filter(b => b.severity === 'major').length,
            minor: bugs.filter(b => b.severity === 'minor').length,
            trivial: bugs.filter(b => b.severity === 'trivial').length
        }
    };

    res.json(stats);
});

// GET /api/health - Endpoint de santé pour CI/CD
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
    });
});

// Route catch-all pour le SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ================================
// Démarrage du serveur
// ================================
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🐛 BugTrack server running on http://localhost:${PORT}`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
}

module.exports = app;

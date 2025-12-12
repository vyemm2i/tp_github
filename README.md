# BugTrack - Système de Suivi de Bugs

Application de gestion de bugs pour le TP CI/CD des testeurs en alternance.

## Fonctionnalités

- Création et gestion de bugs avec priorité et sévérité
- Workflow de statuts (Open → In Progress → Resolved → Closed)
- Filtres avancés (statut, priorité, sévérité, assigné)
- Recherche full-text
- Vue Liste et vue Kanban
- Commentaires sur les bugs
- 3 utilisateurs simulés (Dev, QA, Lead)
- API REST complète
- Interface responsive

## Prérequis

- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Lancement

```bash
# Mode développement (avec hot reload)
npm run dev

# Mode production
npm start
```

L'application sera disponible sur http://localhost:3000

## Tests

```bash
# Ouvrir Cypress en mode interactif
npm run test:open

# Lancer les tests en mode headless (CI)
npm run test:ci
```

## API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/bugs | Liste tous les bugs |
| GET | /api/bugs/:id | Récupère un bug |
| POST | /api/bugs | Crée un bug |
| PUT | /api/bugs/:id | Met à jour un bug |
| DELETE | /api/bugs/:id | Supprime un bug |
| POST | /api/bugs/:id/comments | Ajoute un commentaire |
| GET | /api/stats | Statistiques |
| GET | /api/health | Health check |

## Docker

```bash
# Build
docker build -t bug-tracker .

# Run
docker run -p 3000:3000 bug-tracker
```

## Objectif du TP

Configurer une pipeline CI/CD qui :
1. Exécute les tests Cypress automatiquement
2. Construit l'image Docker si les tests passent
3. Pousse l'image vers un registry avec des tags appropriés

Voir le fichier `SUJET_TP.md` pour les instructions complètes.

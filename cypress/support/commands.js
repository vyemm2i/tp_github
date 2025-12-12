// ***********************************************
// Commandes personnalisées Cypress pour BugTrack
// ***********************************************

/**
 * Créer un nouveau bug via l'interface
 */
Cypress.Commands.add('createBug', (bugData) => {
  const {
    title,
    priority = 'medium',
    severity = 'minor',
    description,
    assignee = '',
    environment = 'production',
    steps = '',
    expected = '',
    actual = ''
  } = bugData;

  cy.get('[data-testid="new-bug-btn"]').click();
  cy.get('[data-testid="bug-modal"]').should('be.visible');

  cy.get('[data-testid="bug-title"]').clear().type(title);
  cy.get('[data-testid="bug-priority"]').select(priority);
  cy.get('[data-testid="bug-severity"]').select(severity);
  cy.get('[data-testid="bug-description"]').clear().type(description);

  if (assignee) {
    cy.get('[data-testid="bug-assignee"]').select(assignee);
  }

  if (environment) {
    cy.get('[data-testid="bug-environment"]').select(environment);
  }

  if (steps) {
    cy.get('[data-testid="bug-steps"]').clear().type(steps);
  }

  if (expected) {
    cy.get('[data-testid="bug-expected"]').clear().type(expected);
  }

  if (actual) {
    cy.get('[data-testid="bug-actual"]').clear().type(actual);
  }

  cy.get('[data-testid="submit-btn"]').click();
  cy.get('[data-testid="bug-modal"]').should('not.be.visible');
});

/**
 * Créer un bug via l'API
 */
Cypress.Commands.add('createBugApi', (bugData) => {
  return cy.request('POST', '/api/bugs', {
    title: bugData.title,
    description: bugData.description || 'Description de test',
    priority: bugData.priority || 'medium',
    severity: bugData.severity || 'minor',
    assignee: bugData.assignee || null,
    environment: bugData.environment || 'production',
    reporter: bugData.reporter || 'bob'
  });
});

/**
 * Supprimer tous les bugs via l'API
 */
Cypress.Commands.add('clearAllBugs', () => {
  cy.request('GET', '/api/bugs').then((response) => {
    response.body.forEach((bug) => {
      cy.request('DELETE', `/api/bugs/${bug.id}`);
    });
  });
});

/**
 * Ouvrir le détail d'un bug
 */
Cypress.Commands.add('openBugDetail', (bugId) => {
  cy.get(`[data-id="${bugId}"]`).click();
  cy.get('[data-testid="detail-modal"]').should('be.visible');
});

/**
 * Changer le statut d'un bug depuis le modal de détail
 */
Cypress.Commands.add('changeBugStatus', (bugId, newStatus) => {
  cy.openBugDetail(bugId);
  cy.get(`[data-testid="status-btn-${newStatus}"]`).click();
  cy.get('[data-testid="toast"]').should('contain', 'mis à jour');
});

/**
 * Filtrer les bugs
 */
Cypress.Commands.add('filterBugs', (filterType, value) => {
  cy.get(`[data-testid="filter-${filterType}"]`).select(value);
});

/**
 * Rechercher des bugs
 */
Cypress.Commands.add('searchBugs', (searchTerm) => {
  cy.get('[data-testid="filter-search"]').clear().type(searchTerm);
  // Attendre le debounce
  cy.wait(400);
});

/**
 * Vérifier le nombre de bugs affichés
 */
Cypress.Commands.add('shouldHaveBugs', (count) => {
  if (count === 0) {
    cy.get('[data-testid="empty-state"]').should('be.visible');
  } else {
    cy.get('[data-testid="bug-card"]').should('have.length', count);
  }
});

/**
 * Changer d'utilisateur
 */
Cypress.Commands.add('switchUser', (userId) => {
  cy.get('[data-testid="user-select"]').select(userId);
});

/**
 * Basculer vers la vue tableau
 */
Cypress.Commands.add('switchToBoard', () => {
  cy.get('[data-testid="view-board"]').click();
  cy.get('[data-testid="bug-board"]').should('be.visible');
});

/**
 * Basculer vers la vue liste
 */
Cypress.Commands.add('switchToList', () => {
  cy.get('[data-testid="view-list"]').click();
  cy.get('[data-testid="bug-list"]').should('be.visible');
});

/**
 * Ajouter un commentaire
 */
Cypress.Commands.add('addComment', (bugId, commentText) => {
  cy.openBugDetail(bugId);
  cy.get('[data-testid="comment-input"]').clear().type(commentText);
  cy.get('[data-testid="submit-comment"]').click();
  cy.get('[data-testid="toast"]').should('contain', 'Commentaire ajouté');
});

/**
 * Vérifier les statistiques
 */
Cypress.Commands.add('checkStats', ({ total, open, progress, resolved }) => {
  if (total !== undefined) {
    cy.get('#stat-total').should('contain', total);
  }
  if (open !== undefined) {
    cy.get('#stat-open').should('contain', open);
  }
  if (progress !== undefined) {
    cy.get('#stat-progress').should('contain', progress);
  }
  if (resolved !== undefined) {
    cy.get('#stat-resolved').should('contain', resolved);
  }
});

// ***********************************************************
// Support file for Cypress e2e tests
// Ce fichier est chargé automatiquement avant chaque test
// ***********************************************************

import './commands';

// Gestion des erreurs non capturées
Cypress.on('uncaught:exception', (err, runnable) => {
  console.error('Uncaught exception:', err.message);
  return false;
});

// Hook avant chaque test
beforeEach(() => {
  // Visiter la page d'accueil et attendre le chargement
  cy.visit('/');
  cy.get('[data-testid="bug-list"]').should('exist');
});

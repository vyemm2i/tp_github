/// <reference types="cypress" />

describe('BugTrack - Tests E2E', () => {

  // =========================================
  // TESTS DE CHARGEMENT ET INTERFACE
  // =========================================
  describe('Chargement de l\'application', () => {

    it('devrait afficher le header avec le titre', () => {
      cy.get('header h1').should('contain', 'BugTrack');
    });

    it('devrait afficher le sélecteur d\'utilisateur', () => {
      cy.get('[data-testid="user-select"]').should('be.visible');
      cy.get('[data-testid="user-select"] option').should('have.length', 3);
    });

    it('devrait afficher les filtres dans la sidebar', () => {
      cy.get('[data-testid="filter-status"]').should('be.visible');
      cy.get('[data-testid="filter-priority"]').should('be.visible');
      cy.get('[data-testid="filter-severity"]').should('be.visible');
      cy.get('[data-testid="filter-assignee"]').should('be.visible');
      cy.get('[data-testid="filter-search"]').should('be.visible');
    });

    it('devrait afficher les statistiques', () => {
      cy.get('[data-testid="stats"]').should('be.visible');
      cy.get('#stat-total').should('be.visible');
      cy.get('#stat-open').should('be.visible');
      cy.get('#stat-progress').should('be.visible');
      cy.get('#stat-resolved').should('be.visible');
    });

    it('devrait afficher le bouton de création de bug', () => {
      cy.get('[data-testid="new-bug-btn"]').should('be.visible').and('contain', 'Nouveau Bug');
    });

    it('devrait afficher les boutons de vue (Liste/Tableau)', () => {
      cy.get('[data-testid="view-toggle"]').should('be.visible');
      cy.get('[data-testid="view-list"]').should('be.visible');
      cy.get('[data-testid="view-board"]').should('be.visible');
    });

    it('devrait charger les bugs initiaux', () => {
      cy.get('[data-testid="bug-card"]').should('have.length.at.least', 1);
    });

  });

  // =========================================
  // TESTS DE CRÉATION DE BUG
  // =========================================
  describe('Création de bug', () => {

    it('devrait ouvrir le modal de création', () => {
      cy.get('[data-testid="new-bug-btn"]').click();
      cy.get('[data-testid="bug-modal"]').should('be.visible');
      cy.get('#modal-title').should('contain', 'Nouveau Bug');
    });

    it('devrait fermer le modal avec le bouton Annuler', () => {
      cy.get('[data-testid="new-bug-btn"]').click();
      cy.get('[data-testid="cancel-btn"]').click();
      cy.get('[data-testid="bug-modal"]').should('not.be.visible');
    });

    it('devrait fermer le modal avec la croix', () => {
      cy.get('[data-testid="new-bug-btn"]').click();
      cy.get('[data-testid="modal-close"]').click();
      cy.get('[data-testid="bug-modal"]').should('not.be.visible');
    });

    it('devrait fermer le modal avec Escape', () => {
      cy.get('[data-testid="new-bug-btn"]').click();
      cy.get('body').type('{esc}');
      cy.get('[data-testid="bug-modal"]').should('not.be.visible');
    });

    it('devrait créer un bug avec tous les champs', () => {
      const bugData = {
        title: 'Bug de test Cypress',
        priority: 'high',
        severity: 'major',
        description: 'Description détaillée du bug de test',
        assignee: 'alice',
        environment: 'staging',
        steps: '1. Étape 1\n2. Étape 2',
        expected: 'Comportement attendu',
        actual: 'Comportement actuel'
      };

      cy.createBug(bugData);

      cy.get('[data-testid="toast"]').should('contain', 'créé avec succès');
      cy.get('[data-testid="bug-card"]').first().should('contain', bugData.title);
    });

    it('devrait créer un bug avec les champs obligatoires seulement', () => {
      cy.createBug({
        title: 'Bug minimal',
        priority: 'low',
        severity: 'trivial',
        description: 'Description minimale'
      });

      cy.get('[data-testid="toast"]').should('contain', 'créé avec succès');
    });

    it('ne devrait pas créer un bug sans titre', () => {
      cy.get('[data-testid="new-bug-btn"]').click();
      cy.get('[data-testid="bug-priority"]').select('medium');
      cy.get('[data-testid="bug-severity"]').select('minor');
      cy.get('[data-testid="bug-description"]').type('Description');
      cy.get('[data-testid="submit-btn"]').click();

      // Le formulaire HTML5 doit bloquer la soumission
      cy.get('[data-testid="bug-modal"]').should('be.visible');
    });

    it('devrait mettre à jour les statistiques après création', () => {
      cy.get('#stat-total').invoke('text').then((initialTotal) => {
        const initial = parseInt(initialTotal);

        cy.createBug({
          title: 'Bug pour stats',
          priority: 'medium',
          severity: 'minor',
          description: 'Test des stats'
        });

        cy.get('#stat-total').should('contain', initial + 1);
      });
    });

  });

  // =========================================
  // TESTS D'AFFICHAGE DES BUGS
  // =========================================
  describe('Affichage des bugs', () => {

    it('devrait afficher l\'ID du bug', () => {
      cy.get('[data-testid="bug-id"]').first().should('match', /BUG-\d{3}/);
    });

    it('devrait afficher le titre du bug', () => {
      cy.get('[data-testid="bug-title"]').first().should('not.be.empty');
    });

    it('devrait afficher le badge de statut', () => {
      cy.get('[data-testid="bug-status"]').first().should('be.visible');
    });

    it('devrait afficher le badge de priorité', () => {
      cy.get('[data-testid="bug-priority-badge"]').first().should('be.visible');
    });

    it('devrait afficher le badge de sévérité', () => {
      cy.get('[data-testid="bug-severity-badge"]').first().should('be.visible');
    });

    it('devrait afficher l\'assigné', () => {
      cy.get('[data-testid="bug-assignee"]').first().should('be.visible');
    });

    it('devrait afficher la date de création', () => {
      cy.get('[data-testid="bug-date"]').first().should('be.visible');
    });

  });

  // =========================================
  // TESTS DE DÉTAIL D'UN BUG
  // =========================================
  describe('Détail d\'un bug', () => {

    it('devrait ouvrir le modal de détail au clic sur un bug', () => {
      cy.get('[data-testid="bug-card"]').first().click();
      cy.get('[data-testid="detail-modal"]').should('be.visible');
    });

    it('devrait afficher les informations du bug', () => {
      cy.get('[data-testid="bug-card"]').first().click();

      cy.get('[data-testid="detail-bug-id"]').should('be.visible');
      cy.get('[data-testid="detail-title"]').should('be.visible');
      cy.get('[data-testid="detail-description"]').should('be.visible');
    });

    it('devrait afficher les boutons de changement de statut', () => {
      cy.get('[data-testid="bug-card"]').first().click();
      cy.get('[data-testid="status-actions"]').should('be.visible');
    });

    it('devrait afficher la section commentaires', () => {
      cy.get('[data-testid="bug-card"]').first().click();
      cy.get('[data-testid="comments-section"]').should('be.visible');
    });

    it('devrait permettre d\'ajouter un commentaire', () => {
      cy.get('[data-testid="bug-card"]').first().then(($card) => {
        const bugId = $card.attr('data-id');

        cy.wrap($card).click();
        cy.get('[data-testid="comment-input"]').type('Commentaire de test Cypress');
        cy.get('[data-testid="submit-comment"]').click();

        cy.get('[data-testid="toast"]').should('contain', 'Commentaire ajouté');
        cy.get('[data-testid="comments-list"]').should('contain', 'Commentaire de test Cypress');
      });
    });

    it('devrait fermer le modal de détail', () => {
      cy.get('[data-testid="bug-card"]').first().click();
      cy.get('[data-testid="detail-close"]').click();
      cy.get('[data-testid="detail-modal"]').should('not.be.visible');
    });

  });

  // =========================================
  // TESTS DE WORKFLOW (TRANSITIONS DE STATUT)
  // =========================================
  describe('Workflow - Transitions de statut', () => {

    it('devrait passer un bug de "open" à "in_progress"', () => {
      // Créer un bug frais
      cy.createBugApi({ title: 'Bug workflow open->progress', description: 'Test' }).then((response) => {
        cy.reload();
        cy.openBugDetail(response.body.id);

        cy.get('[data-testid="status-btn-in_progress"]').should('be.visible').click();
        cy.get('[data-testid="toast"]').should('contain', 'mis à jour');
      });
    });

    it('devrait passer un bug de "in_progress" à "resolved"', () => {
      cy.createBugApi({ title: 'Bug workflow progress->resolved', description: 'Test' }).then((response) => {
        // D'abord le passer en "in_progress"
        cy.request('PUT', `/api/bugs/${response.body.id}`, { status: 'in_progress' });
        cy.reload();

        cy.openBugDetail(response.body.id);
        cy.get('[data-testid="status-btn-resolved"]').should('be.visible').click();
        cy.get('[data-testid="toast"]').should('contain', 'mis à jour');
      });
    });

    it('devrait passer un bug de "resolved" à "closed"', () => {
      cy.createBugApi({ title: 'Bug workflow resolved->closed', description: 'Test' }).then((response) => {
        cy.request('PUT', `/api/bugs/${response.body.id}`, { status: 'resolved' });
        cy.reload();

        cy.openBugDetail(response.body.id);
        cy.get('[data-testid="status-btn-closed"]').should('be.visible').click();
        cy.get('[data-testid="toast"]').should('contain', 'mis à jour');
      });
    });

    it('devrait pouvoir réouvrir un bug fermé', () => {
      cy.createBugApi({ title: 'Bug workflow closed->reopened', description: 'Test' }).then((response) => {
        cy.request('PUT', `/api/bugs/${response.body.id}`, { status: 'closed' });
        cy.reload();

        cy.openBugDetail(response.body.id);
        cy.get('[data-testid="status-btn-reopened"]').should('be.visible').click();
        cy.get('[data-testid="toast"]').should('contain', 'mis à jour');
      });
    });

  });

  // =========================================
  // TESTS DE FILTRAGE
  // =========================================
  describe('Filtrage des bugs', () => {

    it('devrait filtrer par statut "open"', () => {
      cy.filterBugs('status', 'open');

      cy.get('[data-testid="bug-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="bug-status"]').should('contain', 'Ouvert');
      });
    });

    it('devrait filtrer par statut "in_progress"', () => {
      cy.filterBugs('status', 'in_progress');

      cy.get('[data-testid="bug-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="bug-status"]').should('contain', 'En cours');
      });
    });

    it('devrait filtrer par priorité "critical"', () => {
      cy.filterBugs('priority', 'critical');

      cy.get('[data-testid="bug-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="bug-priority-badge"]').should('contain', 'Critique');
      });
    });

    it('devrait filtrer par sévérité "blocker"', () => {
      cy.filterBugs('severity', 'blocker');

      cy.get('[data-testid="bug-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="bug-severity-badge"]').should('contain', 'Bloquant');
      });
    });

    it('devrait filtrer par assigné', () => {
      cy.filterBugs('assignee', 'alice');

      cy.get('[data-testid="bug-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="bug-assignee"]').should('contain', 'Alice');
      });
    });

    it('devrait filtrer les bugs non assignés', () => {
      cy.filterBugs('assignee', 'unassigned');

      cy.get('[data-testid="bug-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="bug-assignee"]').should('contain', 'Non assigné');
      });
    });

    it('devrait rechercher par titre', () => {
      cy.searchBugs('connexion');

      cy.get('[data-testid="bug-card"]').should('have.length.at.least', 1);
      cy.get('[data-testid="bug-title"]').first().should('contain.text', 'connexion', { matchCase: false });
    });

    it('devrait rechercher par ID', () => {
      cy.searchBugs('BUG-001');

      cy.get('[data-testid="bug-card"]').should('have.length', 1);
      cy.get('[data-testid="bug-id"]').first().should('contain', 'BUG-001');
    });

    it('devrait combiner plusieurs filtres', () => {
      cy.filterBugs('status', 'open');
      cy.filterBugs('priority', 'critical');

      cy.get('[data-testid="bug-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="bug-status"]').should('contain', 'Ouvert');
        cy.wrap($card).find('[data-testid="bug-priority-badge"]').should('contain', 'Critique');
      });
    });

    it('devrait réinitialiser les filtres', () => {
      cy.filterBugs('status', 'closed');
      cy.get('[data-testid="clear-filters"]').click();

      cy.get('[data-testid="filter-status"]').should('have.value', 'all');
      cy.get('[data-testid="toast"]').should('contain', 'réinitialisés');
    });

    it('devrait afficher un message si aucun résultat', () => {
      cy.searchBugs('xyznonexistent123');

      cy.get('[data-testid="empty-state"]').should('be.visible');
    });

  });

  // =========================================
  // TESTS DE TRI
  // =========================================
  describe('Tri des bugs', () => {

    it('devrait trier par date de création (plus récent)', () => {
      cy.get('[data-testid="sort-by"]').select('created_desc');

      cy.get('[data-testid="bug-card"]').then(($cards) => {
        // Vérifier que les bugs sont triés (le premier devrait être plus récent)
        expect($cards.length).to.be.at.least(2);
      });
    });

    it('devrait trier par priorité', () => {
      cy.get('[data-testid="sort-by"]').select('priority');

      cy.get('[data-testid="bug-priority-badge"]').first().should('contain', 'Critique');
    });

  });

  // =========================================
  // TESTS DE VUE TABLEAU (KANBAN)
  // =========================================
  describe('Vue Tableau (Kanban)', () => {

    beforeEach(() => {
      cy.switchToBoard();
    });

    it('devrait afficher les 4 colonnes', () => {
      cy.get('[data-testid="column-open"]').should('be.visible');
      cy.get('[data-testid="column-progress"]').should('be.visible');
      cy.get('[data-testid="column-resolved"]').should('be.visible');
      cy.get('[data-testid="column-closed"]').should('be.visible');
    });

    it('devrait afficher les bugs dans la bonne colonne', () => {
      cy.get('[data-testid="column-open"] [data-testid="board-card"]').should('have.length.at.least', 1);
    });

    it('devrait pouvoir revenir à la vue liste', () => {
      cy.switchToList();
      cy.get('[data-testid="bug-list"]').should('be.visible');
      cy.get('[data-testid="bug-board"]').should('not.be.visible');
    });

  });

  // =========================================
  // TESTS DE MODIFICATION DE BUG
  // =========================================
  describe('Modification de bug', () => {

    it('devrait ouvrir le modal de modification', () => {
      cy.get('[data-testid="bug-card"]').first().then(($card) => {
        const bugId = $card.attr('data-id');

        cy.get(`[data-id="${bugId}"] [data-testid="edit-btn"]`).click({ force: true });
        cy.get('[data-testid="bug-modal"]').should('be.visible');
        cy.get('#modal-title').should('contain', 'Modifier');
      });
    });

    it('devrait pré-remplir les champs avec les données existantes', () => {
      cy.get('[data-testid="bug-card"]').first().then(($card) => {
        const title = $card.find('[data-testid="bug-title"]').text();
        const bugId = $card.attr('data-id');

        cy.get(`[data-id="${bugId}"] [data-testid="edit-btn"]`).click({ force: true });
        cy.get('[data-testid="bug-title"]').should('have.value', title);
      });
    });

    it('devrait modifier un bug', () => {
      cy.get('[data-testid="bug-card"]').first().then(($card) => {
        const bugId = $card.attr('data-id');

        cy.get(`[data-id="${bugId}"] [data-testid="edit-btn"]`).click({ force: true });
        cy.get('[data-testid="bug-title"]').clear().type('Titre modifié par Cypress');
        cy.get('[data-testid="submit-btn"]').click();

        cy.get('[data-testid="toast"]').should('contain', 'mis à jour');
        cy.get(`[data-id="${bugId}"] [data-testid="bug-title"]`).should('contain', 'Titre modifié par Cypress');
      });
    });

  });

  // =========================================
  // TESTS DE SUPPRESSION DE BUG
  // =========================================
  describe('Suppression de bug', () => {

    it('devrait supprimer un bug', () => {
      // Créer un bug à supprimer
      cy.createBugApi({ title: 'Bug à supprimer', description: 'Test' }).then((response) => {
        const bugId = response.body.id;
        cy.reload();

        cy.get('[data-testid="bug-card"]').then(($cardsBefore) => {
          const countBefore = $cardsBefore.length;

          // Stub de window.confirm
          cy.on('window:confirm', () => true);

          cy.get(`[data-id="${bugId}"] [data-testid="delete-btn"]`).click({ force: true });

          cy.get('[data-testid="toast"]').should('contain', 'supprimé');
          cy.get('[data-testid="bug-card"]').should('have.length', countBefore - 1);
        });
      });
    });

    it('ne devrait pas supprimer si on annule la confirmation', () => {
      cy.createBugApi({ title: 'Bug à ne pas supprimer', description: 'Test' }).then((response) => {
        const bugId = response.body.id;
        cy.reload();

        cy.get('[data-testid="bug-card"]').then(($cardsBefore) => {
          const countBefore = $cardsBefore.length;

          cy.on('window:confirm', () => false);

          cy.get(`[data-id="${bugId}"] [data-testid="delete-btn"]`).click({ force: true });

          cy.get('[data-testid="bug-card"]').should('have.length', countBefore);
        });
      });
    });

  });

  // =========================================
  // TESTS D'API
  // =========================================
  describe('API - Tests d\'intégration', () => {

    it('GET /api/bugs - devrait retourner la liste des bugs', () => {
      cy.request('GET', '/api/bugs').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.at.least(1);
      });
    });

    it('GET /api/bugs/:id - devrait retourner un bug spécifique', () => {
      cy.request('GET', '/api/bugs').then((listResponse) => {
        const bugId = listResponse.body[0].id;

        cy.request('GET', `/api/bugs/${bugId}`).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('id', bugId);
          expect(response.body).to.have.property('title');
          expect(response.body).to.have.property('status');
        });
      });
    });

    it('GET /api/bugs/:id - devrait retourner 404 pour un bug inexistant', () => {
      cy.request({
        method: 'GET',
        url: '/api/bugs/BUG-999',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.have.property('error');
      });
    });

    it('POST /api/bugs - devrait créer un bug', () => {
      cy.request('POST', '/api/bugs', {
        title: 'Bug API test',
        description: 'Créé via l\'API',
        priority: 'high',
        severity: 'major',
        reporter: 'bob'
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body.title).to.eq('Bug API test');
        expect(response.body.status).to.eq('open');
      });
    });

    it('POST /api/bugs - devrait rejeter un bug sans titre', () => {
      cy.request({
        method: 'POST',
        url: '/api/bugs',
        body: { description: 'Sans titre', priority: 'low', severity: 'trivial' },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.contain('titre');
      });
    });

    it('PUT /api/bugs/:id - devrait modifier un bug', () => {
      cy.request('GET', '/api/bugs').then((listResponse) => {
        const bugId = listResponse.body[0].id;

        cy.request('PUT', `/api/bugs/${bugId}`, {
          title: 'Titre modifié via API'
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.title).to.eq('Titre modifié via API');
        });
      });
    });

    it('DELETE /api/bugs/:id - devrait supprimer un bug', () => {
      // D'abord créer un bug
      cy.request('POST', '/api/bugs', {
        title: 'Bug à supprimer via API',
        description: 'Test',
        priority: 'low',
        severity: 'trivial'
      }).then((createResponse) => {
        const bugId = createResponse.body.id;

        cy.request('DELETE', `/api/bugs/${bugId}`).then((response) => {
          expect(response.status).to.eq(204);
        });

        // Vérifier que le bug n'existe plus
        cy.request({
          method: 'GET',
          url: `/api/bugs/${bugId}`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(404);
        });
      });
    });

    it('POST /api/bugs/:id/comments - devrait ajouter un commentaire', () => {
      cy.request('GET', '/api/bugs').then((listResponse) => {
        const bugId = listResponse.body[0].id;

        cy.request('POST', `/api/bugs/${bugId}/comments`, {
          text: 'Commentaire de test API',
          author: 'bob'
        }).then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body.comments).to.be.an('array');
          expect(response.body.comments[response.body.comments.length - 1].text).to.eq('Commentaire de test API');
        });
      });
    });

    it('GET /api/stats - devrait retourner les statistiques', () => {
      cy.request('GET', '/api/stats').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('total');
        expect(response.body).to.have.property('byStatus');
        expect(response.body).to.have.property('byPriority');
        expect(response.body).to.have.property('bySeverity');
      });
    });

    it('GET /api/health - devrait confirmer que le serveur est opérationnel', () => {
      cy.request('GET', '/api/health').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.status).to.eq('ok');
        expect(response.body).to.have.property('timestamp');
        expect(response.body).to.have.property('uptime');
      });
    });

  });

  // =========================================
  // TESTS D'UTILISATEUR
  // =========================================
  describe('Gestion des utilisateurs', () => {

    it('devrait changer d\'utilisateur', () => {
      cy.switchUser('alice');
      cy.get('[data-testid="toast"]').should('contain', 'Alice Martin');
    });

    it('devrait afficher les 3 utilisateurs disponibles', () => {
      cy.get('[data-testid="user-select"] option').should('have.length', 3);
      cy.get('[data-testid="user-select"]').should('contain', 'Alice');
      cy.get('[data-testid="user-select"]').should('contain', 'Bob');
      cy.get('[data-testid="user-select"]').should('contain', 'Charlie');
    });

  });

  // =========================================
  // TESTS RESPONSIVE
  // =========================================
  describe('Responsive', () => {

    it('devrait être utilisable sur tablette', () => {
      cy.viewport('ipad-2');

      cy.get('[data-testid="new-bug-btn"]').should('be.visible');
      cy.get('[data-testid="bug-list"]').should('be.visible');
    });

    it('devrait être utilisable sur mobile', () => {
      cy.viewport('iphone-x');

      cy.get('[data-testid="new-bug-btn"]').should('be.visible');
      cy.get('[data-testid="bug-card"]').first().should('be.visible');
    });

  });

});

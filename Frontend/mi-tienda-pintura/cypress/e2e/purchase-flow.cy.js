// cypress/e2e/purchase-flow.cy.js

/**
 * Describe el conjunto de pruebas para el flujo de compra completo.
 */
describe('Flujo de Compra Completo', () => {
  
  /**
   * Se ejecuta una vez antes de cada prueba en este bloque.
   * Aquí interceptaremos todas las llamadas a la API necesarias para el flujo.
   */
  beforeEach(() => {
    // 1. Mock de la lista de productos para la página de inicio
    cy.intercept('GET', '/api/products*', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Látex Interior Mate', brand: 'Alba', price: 15000, imageUrl: 'https://placehold.co/300x224/0F3460/white?text=Pintura', averageRating: 4.5, reviewCount: 10, stock: 10, category: 'Interior' },
      ],
    }).as('getProducts');

    // 2. Mock del detalle de un producto específico
    cy.intercept('GET', '/api/products/1', {
      statusCode: 200,
      body: { id: 1, name: 'Látex Interior Mate', brand: 'Alba', price: 15000, imageUrl: 'https://placehold.co/500x500/0F3460/white?text=Pintura', averageRating: 4.5, reviewCount: 10, stock: 10, category: 'Interior', description: 'Descripción de prueba.' },
    }).as('getProductDetail');

    // 3. Mock de las reseñas para la página de detalle
    cy.intercept('GET', '/api/products/1/reviews', {
      statusCode: 200,
      body: [], // Devolvemos un array vacío para simplificar
    }).as('getProductReviews');

    // 4. Mock del inicio de sesión
    const mockUser = { userId: 1, email: 'test@example.com', role: 'user' };
    const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(mockUser))}.fake-signature`;
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: mockToken, user: mockUser },
    }).as('loginRequest');

    // 5. Mock de la creación de la preferencia de pago en NUESTRO backend
    cy.intercept('POST', '/api/orders/create-payment-preference', {
        statusCode: 200,
        body: { id: 'pref_12345' } // Un ID de preferencia falso
    }).as('createPreference');

    // --- CAMBIO CLAVE: Se añade una nueva intercepción ---
    // 6. Mock de la petición que el SDK de Mercado Pago hace a SUS servidores
    // para obtener los detalles de la preferencia.
    cy.intercept('GET', 'https://api.mercadopago.com/bricks/preferences/pref_12345*', {
      statusCode: 200,
      body: {
        // Devolvemos una estructura mínima que el SDK espera para renderizar el botón.
        id: 'pref_12345',
        items: [
          { title: 'Látex Interior Mate', quantity: 1, unit_price: 15000 }
        ],
        purpose: 'wallet_purchase' // Importante para que sepa qué botón renderizar
      }
    }).as('getMPPreference');
  });

  it('debería permitir a un usuario iniciar sesión, añadir un producto y llegar al checkout', () => {
    // --- 1. Visitar la página e ir a Login ---
    cy.visit('/');
    cy.wait('@getProducts');
    cy.contains('Mi Cuenta').click();
    cy.url().should('include', '/login');

    // --- 2. Iniciar Sesión ---
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.contains('button', 'Ingresar').click();
    cy.wait('@loginRequest');

    cy.contains('Hola, test').should('be.visible');

    // --- 3. Añadir Producto al Carrito ---
    cy.contains('Látex Interior Mate').click();
    cy.url().should('include', '/product/1');
    cy.wait('@getProductDetail');
    cy.contains('button', 'Agregar al Carrito').click();
    
    cy.contains('¡Añadido al carrito!').should('be.visible');
    cy.get('header').contains('1').should('be.visible');

    // --- 4. Ir al Carrito y al Checkout ---
    cy.get('a[href="/cart"]').first().click({ force: true });
    cy.url().should('include', '/cart');
    cy.contains('Látex Interior Mate').should('be.visible');
    cy.contains('Finalizar Compra').click();

    // --- 5. Verificar la Página de Checkout ---
    cy.url().should('include', '/checkout');
    cy.contains('h2', 'Tu Pedido').should('be.visible');
    cy.contains('Continuar al Pago').click();
    cy.wait('@createPreference');

    // La intercepción del paso 6 evitará el error 404.
    // Ahora el SDK de MP recibirá una respuesta válida y renderizará el botón.
    cy.get('.mercadopago-button-container').within(() => {
        cy.get('.mercadopago-button', { timeout: 15000 }).should('be.visible');
    });
  });
});

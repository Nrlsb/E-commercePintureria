// cypress/e2e/search.cy.js

/**
 * Describe el conjunto de pruebas para el flujo de búsqueda de productos.
 */
describe('Flujo de Búsqueda', () => {
  
  /**
   * Se ejecuta una vez antes de todas las pruebas en este bloque.
   * Aquí interceptaremos la llamada a la API para simular una respuesta.
   */
  beforeEach(() => {
    // --- CAMBIO CLAVE: Interceptamos la llamada a la API de productos ---
    cy.intercept(
      'GET', // Método HTTP
      '/api/products*', // Patrón de URL a interceptar (el * captura cualquier query string)
      { 
        // La respuesta que queremos simular (mock)
        statusCode: 200,
        body: [
          { id: 1, name: 'Látex Interior Mate', brand: 'Alba', price: 15000, imageUrl: 'url1', averageRating: 4.5, reviewCount: 10, stock: 10, category: 'Interior' },
          { id: 2, name: 'Esmalte Sintético Brillante', brand: 'Sherwin', price: 12500, imageUrl: 'url2', averageRating: 4.0, reviewCount: 5, stock: 5, category: 'Exterior' },
          { id: 3, name: 'Látex para Cielorrasos', brand: 'Colorín', price: 13000, imageUrl: 'url3', averageRating: 4.2, reviewCount: 8, stock: 12, category: 'Interior' },
        ],
      }
    ).as('getProducts'); // Le damos un alias a la intercepción para poder esperarla si es necesario.
  });

  it('debería permitir al usuario buscar un producto y ver los resultados', () => {
    // 1. Visitar la página de inicio.
    cy.visit('/');

    // 2. Esperar a que la llamada a la API inicial se complete.
    cy.wait('@getProducts');

    // 3. Verificar que un elemento clave de la página de inicio es visible.
    cy.contains('h2', 'Los Más Buscados').should('be.visible');

    // 4. Encontrar el input de búsqueda, escribir y verificar.
    cy.get('input[placeholder="Buscar productos, marcas y más..."]')
      .type('látex')
      .should('have.value', 'látex');
    
    // 5. Enviar el formulario.
    cy.get('form').first().submit();

    // 6. Verificar la URL.
    cy.url().should('include', '/search');

    // 7. Verificar el título de la página de resultados.
    cy.contains('h1', 'Resultados para: "látex"').should('be.visible');

    // 8. --- NUEVA VERIFICACIÓN ---
    // Ahora que estamos seguros de que hay datos, verificamos que las tarjetas de producto se muestren.
    cy.contains('Látex Interior Mate').should('be.visible');
    cy.contains('Látex para Cielorrasos').should('be.visible');
    cy.contains('Esmalte Sintético Brillante').should('not.exist'); // Verificar que no aparece el que no coincide.
  });
});

describe('Work Queue', () => {
  beforeEach(() => {
    cy.logout()
    cy.login()

    const username = Cypress.env('range_officer_username')

    cy.task('resetDb')
    cy.task('setupStaffUser', username)
  })

  it('searches for an agreement', () => {
    cy.visit('/home')
    cy.findByText('RAN099915').should('not.exist')
    cy.findByPlaceholderText(/Enter RAN/g).type('RAN099915{enter}')
    cy.findByText('RAN099915').should('exist')
  })
})

describe('Login', () => {
  beforeEach(() => {
    cy.login('range_officer')

    const username = Cypress.env('range_officer_username')

    cy.task('resetDb')
    cy.task('setupStaffUser', username)
  })

  it('Signs in, and shows privacy message on first login', () => {
    const username = Cypress.env('range_officer_username')

    cy.task('query', {
      sql: 'UPDATE user_account SET pia_seen=FALSE WHERE username=$1',
      values: [username]
    })

    cy.visit('/home')

    cy.findByText('Privacy Information').should('exist')
    cy.findByText('Continue to MyRangeBC').click()

    cy.findByText('Privacy Information').should('not.exist')

    // User has already seen PIA modal, should not appear on subsequent visits
    cy.reload()
    cy.findByText('Privacy Information').should('not.exist')
  })
})

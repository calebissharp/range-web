describe('Login', () => {
  beforeEach(() => {
    cy.logout()
    cy.login()

    const username = Cypress.env('range_officer_username')

    cy.task('resetDb')
    cy.task('setupStaffUser', username).as('staffUser')
  })

  it('starts a range use plan and saves + submits it', () => {
    cy.login('range_officer')
    cy.visit('/home')
    cy.url().should('not.include', 'login')

    cy.findByPlaceholderText(/Enter RAN/g).type('RAN099915{enter}')

    // Create new plan
    cy.findByText('New plan').click()
    cy.url().should('not.include', 'home')

    cy.findAllByText('Staff Draft').should('have.length', 2)

    // Fill out RUP
    cy.findByLabelText('Range Name').type('Initial RUP test')

    cy.findByLabelText('Plan Start Date')
      .parent()
      .click()

    cy.get('.ui.popup').within(() => {
      cy.contains('.suicr-content-item', '6').click({ force: true })
    })

    cy.findByLabelText('Plan End Date')
      .parent()
      .click()

    cy.get('.ui.popup').within(() => {
      cy.contains('.suicr-content-item', '24').click({ force: true })
    })

    cy.findByText('Add Pasture').click()

    cy.get('.ui.modals').within(() => {
      cy.findByPlaceholderText('Pasture name').type('My pasture')
      cy.findByText('Submit').click()
    })

    cy.findByText('Pasture: My pasture').click()

    cy.findByLabelText(/Allowable AUMs/g).type('23')
    cy.findByLabelText(/Private Land Deduction/g).type('{backspace}12')
    cy.findByLabelText(/Pasture Notes/g).type(
      'Here are my pasture notes{enter}A new line of notes.'
    )

    cy.findByText('Add Plant Community').click()
    cy.findByText('Cattail').click()

    cy.findAllByText('Cattail')
      .eq(1)
      .click()

    cy.findByLabelText(/Aspect/g).type('SW')
    cy.findByLabelText(/Elevation/g)
      .click()
      .contains('700-899')
      .click()
    cy.findByLabelText(/Approved by minister/g).click({ force: true })
    cy.findByLabelText(/Plant Community Description/g).type(
      'Description for my plant community'
    )
    cy.findByLabelText(/Community URL/g).type('https://www.google.com')
    cy.findByLabelText(/Purpose of Action/g)
      .click()
      .contains(/Maintain/g)
      .click()

    // Save
    cy.findByText('Save Draft').click()

    cy.get('.sui-error-message').should('not.exist')
    cy.findByText('Successfully saved draft').should('exist')

    // Submit
    cy.findByText('Submit').click()

    cy.get('.ui.modals').within(() => {
      cy.findByPlaceholderText('Add notes here').type('Submission notes here')
      cy.findByRole('button', { name: 'Confirm' }).click()
    })

    cy.findByText('Submitted to AH for Input').should('exist')

    cy.findByText(/successfully updated the status/g).should('exist')
  })

  it('submits back to staff to sign', () => {
    cy.get('@').then(staffUser => {
      cy.task('query', {
        sql: `INSERT INTO plan(
        agreement_id,
        status_id,
        creator_id,
        range_name,
        plan_start_date,
        plan_end_date,
        uploaded
      )
      VALUES (
        'RAN099915',
        6,
        $1,
        'My range',
        '2020-03-25',
        '2024-09-25',
        true
      ) 
      RETURNING id`,
        values: [staffUser.id]
      })
        .then(res => res.rows[0].id)
        .as('planId')
    })

    cy.get('@planId').then(planId => {
      cy.task('query', {
        sql: `INSERT INTO pasture(
          plan_id,
          name
        )
        VALUES (
          $1,
          'My pasture'
        )
        `,
        values: [planId]
      })
    })

    cy.task('setupAHUser', Cypress.env('agreement_holder_username'))

    cy.visit('/home')
    cy.get('@planId').then(planId => cy.visit(`/range-use-plan/${planId}`))

    cy.findByText('Submit').click()
    cy.get('.ui.modals').within(() => {
      cy.findByPlaceholderText('Add notes here').type('Submission notes here')
      cy.findByRole('button', { name: 'Confirm' }).click()
    })

    cy.findAllByText('Submitted to AH').should('exist')

    cy.logout()
    cy.login('agreement_holder')

    cy.visit('/home')
    cy.get('@planId').then(planId => cy.visit(`/range-use-plan/${planId}`))
    cy.findAllByText('Add Content to RUP').should('have.length', 2)
  })
})

import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Button, Modal, Icon, Form, Radio } from 'semantic-ui-react';
import { getUser, getReferences, getConfirmationsMap } from '../../../reducers/rootReducer';
import { CONFIRMATION_OPTION, REFERENCE_KEY, AMENDMENT_TYPE } from '../../../constants/variables';
import { getPlanTypeDescription, getUserFullName, getUserEmail, findConfirmationWithClientId } from '../../../utils';
import { updateRUPConfirmation } from '../../../actionCreators/planActionCreator';
import { planUpdated, confirmationUpdated } from '../../../actions';
import AHConfirmationList from './AHConfirmationList';
import { InvertedButton } from '../../common';

/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */

class AmendmentConfirmationModal extends Component {
  static propTypes = {
    user: PropTypes.shape({}).isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    plan: PropTypes.shape({}).isRequired,
    clients: PropTypes.arrayOf(PropTypes.object),
    references: PropTypes.shape({}).isRequired,
    confirmationsMap: PropTypes.shape({}).isRequired,
    updateRUPConfirmation: PropTypes.func.isRequired,
    confirmationUpdated: PropTypes.func.isRequired,
    planUpdated: PropTypes.func.isRequired,
  };

  static defaultProps = {
    clients: [],
  };

  constructor(props) {
    super(props);
    this.state = this.getInitialState();
  }

  getInitialState = () => (
    {
      activeTab: 0,
      isAgreed: false,
      readyToGoNext: false,
      isConfirmating: false,
      confirmationOption: null,
    }
  )

  onClose = () => {
    this.setState(this.getInitialState());
    this.props.onClose();
  }

  onNextClicked = () => {
    this.setState(prevState => ({
      activeTab: prevState.activeTab + 1,
      readyToGoNext: false,
    }));
  }

  onBackClicked = () => {
    this.setState(prevState => ({
      activeTab: prevState.activeTab - 1,
      readyToGoNext: true,
    }));
  }

  onConfirmChoiceClicked = () => {
    const {
      updateRUPConfirmation, plan, confirmationsMap,
      user, confirmationUpdated, planUpdated, references,
    } = this.props;
    if (this.state.confirmationOption === CONFIRMATION_OPTION.CONFIRM) {
      const onRequest = () => this.setState({ isConfirmating: true });
      const onSuccess = (data) => {
        const { allConfirmed, plan: updatedPlan, confirmation } = data;

        if (allConfirmed) {
          planUpdated({ plan: { ...plan, ...updatedPlan } });
        }

        confirmationUpdated({ confirmation });
        this.setState({ isConfirmating: false });
        this.onNextClicked();
      };
      const onError = (err) => {
        this.setState({ isConfirmating: false });
        throw err;
      };

      const currUserConfirmation = findConfirmationWithClientId(user.clientId, plan.confirmations, confirmationsMap);
      const confirmed = true;
      const amendmentTypes = references[REFERENCE_KEY.AMENDMENT_TYPE];
      const planAmendmentType = amendmentTypes.find(at => at.id === plan.amendmentTypeId);
      const isMinorAmendment = planAmendmentType.code === AMENDMENT_TYPE.MINOR;

      onRequest();
      updateRUPConfirmation(plan, currUserConfirmation.id, confirmed, isMinorAmendment).then(
        (data) => {
          onSuccess(data);
        }, (err) => {
          onError(err);
        },
      );
    } else {
      this.onNextClicked();
    }
  }

  handleSubmissionChoiceChange = (e, { value: confirmationOption }) => {
    if (confirmationOption === CONFIRMATION_OPTION.REQUEST) {
      return this.setState({ confirmationOption, readyToGoNext: true, isAgreed: false });
    }
    return this.setState({ confirmationOption, readyToGoNext: false });
  }

  handleAgreeCheckBoxChange = (e, { checked }) => {
    this.setState({ isAgreed: checked, readyToGoNext: true });
  }

  render() {
    const {
      activeTab,
      readyToGoNext,
      isAgreed,
      isConfirmating,
      confirmationOption,
    } = this.state;
    const { open, user, plan, references, clients, confirmationsMap } = this.props;
    const index = activeTab + 1;
    const amendmentTypes = references[REFERENCE_KEY.AMENDMENT_TYPE];
    const amendmentTypeDescription = getPlanTypeDescription(plan, amendmentTypes);
    const isConfirmBtnDisabled = confirmationOption === CONFIRMATION_OPTION.CONFIRM
      ? !(isAgreed && readyToGoNext) : !readyToGoNext;

    return (
      <Modal
        dimmer="blurring"
        size="tiny"
        open={open}
        onClose={this.onClose}
        closeIcon={<Icon name="close" color="black" />}
      >
        <Modal.Content>
          <Form>
            <div className={classnames('multi-form__tab', { 'multi-form__tab--active': activeTab === 0 })}>
              <div className="multi-form__tab__title">
                {`${index}. Confirm you Submission Choice`}
              </div>
              <Form.Field>
                <Radio
                  label={
                    <label>
                      <b>Confirm and send to Range staff for final decision: </b>
                      Short Description that informs the user about this option.
                    </label>
                  }
                  name="radioGroup"
                  value={CONFIRMATION_OPTION.CONFIRM}
                  checked={confirmationOption === CONFIRMATION_OPTION.CONFIRM}
                  onChange={this.handleSubmissionChoiceChange}
                />
              </Form.Field>
              <Form.Field>
                <Radio
                  label={
                    <label>
                      <b>Request clarification or changes: </b>
                      Short Description that informs the user about this option.
                    </label>
                  }
                  name="radioGroup"
                  value={CONFIRMATION_OPTION.REQUEST}
                  checked={confirmationOption === CONFIRMATION_OPTION.REQUEST}
                  onChange={this.handleSubmissionChoiceChange}
                />
              </Form.Field>
              <AHConfirmationList
                user={user}
                clients={clients}
                plan={plan}
                confirmationsMap={confirmationsMap}
              />
              <Form.Checkbox
                label="I understand that this submission constitues a legal document and eSignature. This submission will be reviewed the Range Staff."
                checked={isAgreed}
                style={{ marginTop: '20px' }}
                disabled={confirmationOption !== CONFIRMATION_OPTION.CONFIRM}
                onChange={this.handleAgreeCheckBoxChange}
                required
              />
              <div className="multi-form__btns">
                <InvertedButton
                  className="multi-form__btn"
                  primaryColor
                  onClick={this.onClose}
                >
                  Cancel
                </InvertedButton>
                <Button
                  className="multi-form__btn"
                  primary
                  disabled={isConfirmBtnDisabled}
                  loading={isConfirmating}
                  onClick={this.onConfirmChoiceClicked}
                >
                  Confirm Choice
                </Button>
              </div>
            </div>
          </Form>

          {confirmationOption === CONFIRMATION_OPTION.CONFIRM &&
            <div className={classnames('multi-form__tab', { 'multi-form__tab--active': activeTab === 1 })}>
              <div className="amendment__submission__last-tab">
                <Icon style={{ marginBottom: '10px' }} name="check circle outline" size="huge" />
                <div className="amendment__submission__last-tab__title">
                  Your {amendmentTypeDescription} confirmation has been saved
                </div>
                <AHConfirmationList
                  user={user}
                  clients={clients}
                  plan={plan}
                  confirmationsMap={confirmationsMap}
                />
                <Button primary style={{ marginTop: '15px' }} onClick={this.onClose}>Finish</Button>
              </div>
            </div>
          }

          {confirmationOption === CONFIRMATION_OPTION.REQUEST &&
            <div className={classnames('multi-form__tab', { 'multi-form__tab--active': activeTab === 1 })}>
              <div className="multi-form__tab__title">
                {`${index}. Request Clarification or Changes`}
              </div>
              <div className="amendment__confirmation__request__header">
                Your approval has not been submitted.
              </div>
              <div style={{ marginBottom: '20px' }}>
                Please contact {`${getUserFullName(plan.creator)}(${getUserEmail(user)})`} who initiated this plan amendment for clarification or to request changes.
              </div>
              <div style={{ marginBottom: '20px' }}>
                Submissions can only be recalled by {getUserFullName(plan.creator)} who initiated this amendment.
              </div>
              <div className="multi-form__btns">
                <InvertedButton
                  className="multi-form__btn"
                  primaryColor
                  onClick={this.onBackClicked}
                >
                  Back
                </InvertedButton>
                <Button
                  className="multi-form__btn"
                  primary
                  onClick={this.onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          }
        </Modal.Content>
      </Modal>
    );
  }
}

const mapStateToProps = state => (
  {
    user: getUser(state),
    references: getReferences(state),
    confirmationsMap: getConfirmationsMap(state),
  }
);

export default connect(mapStateToProps, {
  updateRUPConfirmation,
  planUpdated,
  confirmationUpdated,
})(AmendmentConfirmationModal);

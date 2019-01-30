import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Modal, Form, Button, Icon, Input } from 'semantic-ui-react';
import { getInputModal } from '../../reducers/rootReducer';
import { openInputModal, closeInputModal } from '../../actions';
import { InvertedButton } from '../common';

class InputModal extends Component {
  static propTypes = {
    closeInputModal: PropTypes.func.isRequired,
    inputModal: PropTypes.shape({
      title: PropTypes.string,
      input: PropTypes.string,
      value: PropTypes.shape({}),
      onSubmit: PropTypes.func,
    }),
  }

  static defaultProps = {
    inputModal: null,
  }

  constructor(props) {
    super(props);
    const { inputModal } = props;
    const input = (inputModal && inputModal.input) || '';

    this.state = {
      input,
    };
  }

  onInputChanged = (e) => {
    this.setState({
      input: e.target.value,
    });
  }

  onSubmitClicked = () => {
    const { inputModal = {} } = this.props;
    const { onSubmit, ...rest } = inputModal;

    if (onSubmit) {
      onSubmit(
        this.state.input,
        { ...rest },
      );
    }

    this.handleModalClose();
  }

  onInputKeyPressed = (e) => {
    if (e.charCode === 13) {
      this.onSubmitClicked();
    }
  }

  handleModalClose = () => {
    this.setState({ input: '' });
    this.props.closeInputModal();
  }

  render() {
    const { inputModal } = this.props;
    const { input } = this.state;
    const title = inputModal && inputModal.title;

    return (
      <Modal
        dimmer="blurring"
        size="mini"
        open={inputModal !== null}
        onClose={this.handleModalClose}
        closeIcon
      >
        <div className="input-modal">
          <div className="input-modal__title">
            {title}
          </div>
          <Form>
            <Form.Field>
              <Input
                value={input}
                onChange={this.onInputChanged}
                onKeyPress={this.onInputKeyPressed}
                autoFocus
              />
            </Form.Field>
          </Form>
          <div className="input-modal__btns">
            <InvertedButton
              primaryColor
              fluid
              onClick={this.handleModalClose}
            >
              <Icon name="remove" />
              Cancel
            </InvertedButton>
            <div>
              <Button
                primary
                fluid
                onClick={this.onSubmitClicked}
              >
                <Icon name="checkmark" />
                Submit
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  inputModal: getInputModal(state),
});
export default connect(mapStateToProps, {
  openInputModal,
  closeInputModal,
})(InputModal);
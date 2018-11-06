import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import PublicRoute from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';
import { getUser } from '../../reducers/rootReducer';
import * as Routes from '../../constants/routes';
import {
  ManageZone, ManageClient, SelectRangeUsePlan, RangeUsePlan,
  PDFView, LoginPage, ReturnPage, PageNotFound,
} from './LoadableComponent';

class Router extends Component {
  static propTypes = {
    user: PropTypes.shape({}),
  }

  static defaultProps = {
    user: null,
  }

  render() {
    const { user } = this.props;

    return (
      <BrowserRouter>
        <Switch>
          {/* Admin Routes */}
          <ProtectedRoute path={Routes.MANAGE_ZONE} component={ManageZone} user={user} />
          <ProtectedRoute path={Routes.MANAGE_CLIENT} component={ManageClient} user={user} />
          {/* Admin Routes End */}

          <ProtectedRoute path={Routes.HOME} component={SelectRangeUsePlan} user={user} />
          <ProtectedRoute path={Routes.RANGE_USE_PLAN_WITH_PARAM} component={RangeUsePlan} user={user} />
          <ProtectedRoute path={Routes.EXPORT_PDF_WITH_PARAM} component={PDFView} user={user} />

          <PublicRoute path={Routes.LOGIN} component={LoginPage} user={user} />

          <Route path="/return-page" component={ReturnPage} />
          <Route path="/" exact render={() => (<Redirect to={Routes.LOGIN} />)} />
          <Route component={PageNotFound} />
        </Switch>
      </BrowserRouter>
    );
  }
}

const mapStateToProps = state => (
  {
    user: getUser(state),
  }
);

export default connect(mapStateToProps, null)(Router);

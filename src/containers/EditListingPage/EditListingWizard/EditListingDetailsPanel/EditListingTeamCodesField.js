import React, { useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useForm, useFormState } from 'react-final-form';

import { FormattedMessage } from '../../../../util/reactIntl';
import { ensureCurrentUser } from '../../../../util/data';
import { isIndividualAccount, getJoinedTeamCodes, formatTeamCode } from '../../../../util/teams';
import { loadTeamNames } from '../../../../ducks/team.duck';
import { FieldCheckboxGroup } from '../../../../components';

import css from './EditListingDetailsForm.module.css';

/**
 * Lets an Individual seller choose which of their teams a listing belongs to. Selected team codes
 * are stored on the listing's `publicData.teamCodes` (carried through the details-panel submit and
 * preserved by `withSellerTeamCodes` in EditListingPage.duck.js), so the listing surfaces on those
 * teams' dashboards via a `pub_teamCodes` query.
 *
 * Self-contained: reads the current user + resolved team names from Redux rather than threading
 * them through the generic wizard/form plumbing. Renders nothing for team accounts (they auto-use
 * their own code) or for individuals with no joined teams.
 *
 * @component
 * @param {Object} props
 * @param {string} props.formId - the parent form id, used to namespace the field id
 * @returns {JSX.Element|null}
 */
const EditListingTeamCodesFieldComponent = props => {
  const { formId, currentUser, teamNames = {}, onLoadTeamNames } = props;

  const user = ensureCurrentUser(currentUser);
  const joinedCodes = getJoinedTeamCodes(user);
  const joinedKey = joinedCodes.join(',');

  const form = useForm();
  const { values } = useFormState({ subscription: { values: true } });

  // Resolve codes -> names for nicer labels (falls back to the formatted code).
  useEffect(() => {
    if (joinedCodes.length > 0) {
      onLoadTeamNames(joinedCodes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLoadTeamNames, joinedKey]);

  // Pre-check every team when the listing has no selection yet (new listing, or one created
  // before this picker existed). An explicit empty array (user unchecked all) is left untouched.
  useEffect(() => {
    if (values.teamCodes == null && joinedCodes.length > 0) {
      form.change('teamCodes', joinedCodes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isIndividualAccount(user) || joinedCodes.length === 0) {
    return null;
  }

  const options = joinedCodes.map(code => ({
    key: code,
    label: teamNames[code] || formatTeamCode(code),
  }));

  return (
    <FieldCheckboxGroup
      className={css.teamCodes}
      id={`${formId}.teamCodes`}
      name="teamCodes"
      label={<FormattedMessage id="EditListingDetailsForm.teamCodesLabel" />}
      helpText={<FormattedMessage id="EditListingDetailsForm.teamCodesHelp" />}
      options={options}
    />
  );
};

const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
  teamNames: state.team.teamNames,
});

const mapDispatchToProps = dispatch => ({
  onLoadTeamNames: codes => dispatch(loadTeamNames(codes)),
});

const EditListingTeamCodesField = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EditListingTeamCodesFieldComponent);

export default EditListingTeamCodesField;

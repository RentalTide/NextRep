/**
 * Resolve a batch of team codes to their (public) team names and account ids, via the
 * Integration API. Lets the client show "Seattle Little League" instead of a bare code, and
 * link the code to the team's public profile page (/u/:id). Read-only.
 *
 * Request body: { teamCodes: string[] }
 * Response: {
 *   names: { [canonicalCode]: teamName },  // only codes that resolve are included
 *   ids:   { [canonicalCode]: userId },    // team account uuid, for the public-profile link
 * }
 */
const { handleError } = require('../api-util/sdk');
const { getIntegrationSdk, integrationSdkConfigured } = require('../api-util/integrationSdk');

// Mirror normalizeTeamCode in src/util/teams.js.
const normalizeTeamCode = input =>
  String(input == null ? '' : input)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

module.exports = (req, res) => {
  const raw = Array.isArray((req.body || {}).teamCodes) ? req.body.teamCodes : [];
  const codes = [...new Set(raw.map(normalizeTeamCode).filter(Boolean))];

  if (codes.length === 0 || !integrationSdkConfigured()) {
    return res.status(200).json({ names: {}, ids: {} });
  }

  const sdk = getIntegrationSdk();
  // enum extended-data filtering treats a comma-separated value as OR, so one query covers all codes.
  return sdk.users
    .query({ pub_teamCode: codes.join(','), pub_userType: 'teamname', perPage: 100 })
    .then(response => {
      const names = {};
      const ids = {};
      (response.data.data || []).forEach(user => {
        const profile = user.attributes.profile || {};
        const code = profile.publicData?.teamCode;
        if (code) {
          names[code] = profile.publicData?.teamnamecustom || profile.displayName || null;
          ids[code] = user.id?.uuid || null;
        }
      });
      res.status(200).json({ names, ids });
    })
    .catch(e => handleError(res, e));
};

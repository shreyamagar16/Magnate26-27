/**
 * EDIT FIELDS HERE.
 *
 * Core keys: name, email, whatsapp — must stay; they map to database columns and
 * duplicate-protection indexes. Their label/required/type can change; any other
 * member or team field you add is saved automatically in the `extra` JSON column.
 *
 * Field types supported: text | email | tel | textarea | url | select (with options[]).
 * leaderOnly: true  — collected only for member 1 (the team leader).
 * required: true    — must be non-empty to submit.
 * core: true        — maps to a top-level DB column; others go into `extra`.
 */

export const DEFAULT_EVENT = 'ideathon';

export const REGISTRATION_EVENTS = {
  ideathon: {
    label: 'Ideathon',
    tagline: 'Innovate and Create',
    open: true,
    minMembers: 1,
    maxMembers: 4,
    whatsappUrl: '',
    /** Extra team-level fields only — team name is always collected.
     *  Example shape: { key:'idea', label:'Idea / Domain', type:'select', required:true, options:['A','B'] }
     */
    teamFields: [],
    memberFields: [
      { key: 'name',     label: 'Full Name',    type: 'text',  core: true, required: true },
      { key: 'email',    label: 'Email',        type: 'email', core: true, required: true },
      { key: 'whatsapp', label: 'WhatsApp No.', type: 'tel',   core: true, required: true },
    ],
  },

  casecom: {
    label: 'CaseCom',
    tagline: 'Solve real problems',
    open: true,
    minMembers: 2,
    maxMembers: 5,
    whatsappUrl: '',
    /**
     * "Problem Statement" from the official Google Form.
     * The options below are the current placeholder options — update them with
     * the real problem statement titles once they are finalised.
     */
    teamFields: [
      {
        key: 'problem_statement',
        label: 'Problem Statement',
        type: 'select',
        required: false,
        options: ['Option 1', 'Option 2', 'Option 3'],
      },
    ],
    /**
     * Per the Google Form:
     *   - Team Leader  : Name + Email + WhatsApp  (all required)
     *   - Member 2     : Name + WhatsApp           (required)
     *   - Members 3–5  : Name + WhatsApp           (optional cards)
     * Email is only collected from the Team Leader (leaderOnly: true).
     */
    memberFields: [
      { key: 'name',     label: 'Full Name',    type: 'text',  core: true, required: true },
      { key: 'email',    label: 'Email',        type: 'email', core: true, required: true, leaderOnly: true },
      { key: 'whatsapp', label: 'WhatsApp No.', type: 'tel',   core: true, required: true },
    ],
  },
};

/**
 * Returns the event config for the given slug, or undefined if not found.
 * @param {string} slug
 */
export function getEvent(slug) {
  return REGISTRATION_EVENTS[slug];
}

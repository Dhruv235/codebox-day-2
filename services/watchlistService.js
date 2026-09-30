const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'];
const statuses = ['watching', 'favorite'];
const fields = ['player_name', 'team', 'position', 'notes', 'status'];

function validateEntry(input, partial = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw badInput('Provide a JSON object.');
  if (Object.keys(input).some(key => !fields.includes(key))) throw badInput('Unexpected field in player entry.');
  if (partial && !Object.keys(input).length) throw badInput('Provide at least one field to update.');
  const result = {};
  for (const [field, max] of [['player_name', 80], ['team', 80], ['notes', 1000]]) {
    if (partial && input[field] === undefined) continue;
    const value = field === 'notes' && input[field] === undefined ? '' : input[field];
    if (typeof value !== 'string' || value.length > max || (field !== 'notes' && !value.trim())) {
      throw badInput(`${field.replace('_', ' ')} must be ${field === 'notes' ? '0' : '1'}–${max} characters.`);
    }
    result[field] = value.trim();
  }
  for (const [field, choices, fallback] of [['position', positions], ['status', statuses, 'watching']]) {
    if (partial && input[field] === undefined) continue;
    const value = input[field] ?? fallback;
    if (!choices.includes(value)) throw badInput(`Choose a valid ${field}.`);
    result[field] = value;
  }
  return result;
}

function badInput(message) { return Object.assign(new Error(message), { status: 400 }); }

function validateId(id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw badInput('Invalid player ID.');
}

async function result(query) {
  const { data, error } = await query;
  if (error) throw Object.assign(new Error('Database request failed. Please try again.'), { status: 503 });
  return data;
}

const service = {
  list: (db, owner) => result(db.from('watchlist').select('*').eq('owner_id', owner).order('created_at', { ascending: false })),
  create: (db, owner, input) => result(db.from('watchlist').insert({ ...input, owner_id: owner }).select().single()),
  read: (db, owner, id) => result(db.from('watchlist').select('*').eq('owner_id', owner).eq('id', id).maybeSingle()),
  update: (db, owner, id, input) => result(db.from('watchlist').update(input).eq('owner_id', owner).eq('id', id).select().maybeSingle()),
  remove: (db, owner, id) => result(db.from('watchlist').delete().eq('owner_id', owner).eq('id', id).select('id').maybeSingle()),
};

module.exports = { service, validateEntry, validateId, positions, statuses };

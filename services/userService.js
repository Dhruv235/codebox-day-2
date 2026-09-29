const users = [
  { id: 1, name: 'Alex' },
  { id: 2, name: 'Sam' },
];

function getUsers() {
  return users;
}

function getUserById(id) {
  return users.find((user) => String(user.id) === id);
}

module.exports = { getUsers, getUserById };

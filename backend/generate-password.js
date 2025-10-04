const bcrypt = require('bcrypt');

const password = 'password';
const saltRounds = 10;

const hash = bcrypt.hashSync(password, saltRounds);
console.log('Password: ' + password);
console.log('Bcrypt Hash: ' + hash);

// Verify the hash works
const isValid = bcrypt.compareSync(password, hash);
console.log('Hash verification: ' + isValid);

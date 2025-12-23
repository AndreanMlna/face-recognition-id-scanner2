const knex = require('../config/database');
const bcrypt = require('bcrypt');
const salt_round = 10;

const UserService = {
  getAll: async () => {
    return await knex('users').select('id', 'nim', 'nama', 'prodi', 'semester', 'url_photo', 'role');
  },

  getById: async (id) => {
    return await knex('users').where({ id }).first();
  },

  create: async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, salt_round);
    const [newItem] = await knex('users')
      .insert({
        ...data,
        password: hashedPassword
      }).returning('*');
    return newItem;
  },

  update: async (id, data) => {
    const [updatedItem] = await knex('users')
      .where({ id })
      .update(data)
      .returning('*')
    return updatedItem;
  },

  delete: async (id) => {
    return await knex('users').where({ id }).del();
  },

  login: async (nim, password) => {
    const user = await knex('users').where({ nim }).first();
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

module.exports = UserService;
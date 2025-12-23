const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries in users (Opsional: hati-hati jika sudah ada data lain)
  // await knex('users').del();

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await knex('users').insert([
    {
      nama: 'Super Admin Asrama',
      nim: 'admin01',
      password: hashedPassword,
      role: 'admin',
      prodi: 'Management',
      semester: 0
    }
  ]);

  console.log('✅ Admin seed successfully created!');
};
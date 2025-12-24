const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Hapus data lama agar tidak duplikat saat seeding ulang (Opsional)
  // await knex('users').whereIn('role', ['student', 'admin']).del();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const studentPassword = await bcrypt.hash('siswa123', 10); // Password default mahasiswa

  const students = [
    { nim: '442023611001', nama: 'ahmad mukhlis farhan' },
    { nim: '442023611003', nama: 'azhar zuhro' },
    { nim: '442023611014', nama: 'fadel aly' },
    { nim: '442023611021', nama: 'thoriq huzaifi' },
    { nim: '442023611026', nama: 'erlangga dwi' },
    { nim: '442023611039', nama: 'deny akhlasul' },
    { nim: '442023611041', nama: 'rizki anugrah' },
    { nim: '442023611052', nama: 'ahmad rafii' },
    { nim: '442023611055', nama: 'dziffar januarko' },
    { nim: '442023611058', nama: 'elmir yasakha' },
    { nim: '442023611092', nama: 'ahmad nugrahadi' },
    { nim: '442023611094', nama: 'iqbal maulana' },
    { nim: '442023611096', nama: 'farid fajar' },
    { nim: '442023611097', nama: 'gusti ahmad' },
    { nim: '442023611099', nama: 'atha fatur' },
    { nim: '442023611103', nama: 'sukma jati' },
    { nim: '442023611104', nama: 'sabri mutiur' },
  ];

  // Menyiapkan data untuk insert
  const userData = [
    {
      nama: 'Super Admin Asrama',
      nim: 'admin01',
      password: adminPassword,
      role: 'admin',
      prodi: 'Management',
      semester: 0
    },
    ...students.map(s => ({
      nama: s.nama,
      nim: s.nim,
      password: studentPassword,
      role: 'student',
      prodi: 'Informatika', // Nilai default, bisa diubah nanti
      semester: 6           // Nilai default
    }))
  ];

  // Menggunakan 'onConflict' agar jika NIM sudah ada, data tidak error/duplikat
  await knex('users')
    .insert(userData)
    .onConflict('nim')
    .merge();

  console.log(`✅ Seed berhasil: 1 Admin dan ${students.length} Mahasiswa telah terdaftar!`);
};
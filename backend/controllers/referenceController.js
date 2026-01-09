import pool from '../config/database.js';

// Get all kabupaten/kota
export const getKabupatenKota = async (req, res) => {
  try {
    const [data] = await pool.query(
      'SELECT id, nama, tipe FROM kabupaten_kota ORDER BY nama ASC'
    );

    // Format data
    const formatted = data.map(item => ({
      id: item.id,
      nama: item.tipe === 'kabupaten' ? `Kab. ${item.nama}` : `Kota ${item.nama}`,
      tipe: item.tipe
    }));

    res.json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error('Get kabupaten/kota error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

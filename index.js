const express = require('express');
const mssql = require('mssql');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

const config = {
  user: 'sa',
  password: 'Pai2015',
  server: '172.16.200.28',
  database: 'JX2ENG',
  options: {
    trustServerCertificate: true
  }
};

let maxPoin = 11;
let counter = -1;
let totalCounter = 0;
let lastData = null; // Menyimpan data terakhir

let pool; // Variabel pool disimpan di luar fungsi untuk menghindari pembuatan koneksi yang berulang

const getStatus = (poin) => {
  if (poin === 0) {
    counter = 0;
    return 'OK';
  } else if (poin === 1 && counter !== maxPoin) {
    counter++;
    totalCounter++;
    return '';
  } else if (counter === maxPoin) {
    counter++;
    totalCounter++;
    return 'SCAN BARCODE';
  } else {
    totalCounter++;
    return '';
  }
};

const fetchData = async () => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query("SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = 5 ORDER BY DATE DESC");
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData || JSON.stringify(lastData) !== JSON.stringify(data)) {
      lastData = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus(data.COUNT);
      return { ...data, Status: status, Counter: counter, TotalCounter: totalCounter };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

app.use(cors());

app.get('/data', async (req, res) => {
  const data = await fetchData();
  if (data) {
    res.json({ ...data, Counter: counter, TotalCounter: totalCounter });
  } else {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

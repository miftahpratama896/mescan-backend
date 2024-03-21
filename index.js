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

app.use(cors());

let maxPoin = 11;
let counter = -1;
let totalCounter = 0;
let lastData = null; // Menyimpan data terakhir

let pool; // Variabel pool disimpan di luar fungsi untuk menghindari pembuatan koneksi yang berulang

const getStatus = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_8 menjadi 0
  if ((currentHour === 7 && currentMinutes === 0) || (currentHour === 21 && currentMinutes === 30)) {
   totalCounter_1 = 0;
  }
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

const fetchData = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(`SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`);
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


app.get('/data1', async (req, res) => {
 
  const data = await fetchData(1);
  if (data) {
    res.json({ ...data, Counter: counter, TotalCounter: totalCounter });
  } else {
    res.status(500).json({ message: 'Internal server error' });
  }
});

let maxPoin_2 = 11;
let counter_2 = -1;
let totalCounter_2 = 0;
let lastData_2 = null; // Menyimpan data terakhir


const getStatus_2 = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_8 menjadi 0
  if ((currentHour === 7 && currentMinutes === 0) || (currentHour === 21 && currentMinutes === 30)) {
   totalCounter_2 = 0;
  }
  if (poin === 0) {
    counter_2 = 0;
    return 'OK';
  } else if (poin === 1 && counter_2 !== maxPoin_2) {
    counter_2++;
    totalCounter_2++;
    return '';
  } else if (counter_2 === maxPoin_2) {
    counter_2++;
    totalCounter_2++;
    return 'SCAN BARCODE';
  } else {
    totalCounter_2++;
    return '';
  }
};

const fetchData_2 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(`SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`);
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_2 || JSON.stringify(lastData_2) !== JSON.stringify(data)) {
      lastData_2 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_2(data.COUNT);
      return { ...data, Status: status, Counter: counter_2, TotalCounter: totalCounter_2 };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};


app.get('/data2', async (req, res) => {
  const data = await fetchData_2(2); // Menggunakan fetchData_2 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_2, TotalCounter: totalCounter_2 }); // Menggunakan counter_2 dan totalCounter_2
  } else {
    res.status(500).json({ message: 'Internal server error' });
  }
});


let maxPoin_3 = 11;
let counter_3 = -1;
let totalCounter_3 = 0;
let lastData_3 = null; // Menyimpan data terakhir

const getStatus_3 = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_8 menjadi 0
  if ((currentHour === 7 && currentMinutes === 0) || (currentHour === 21 && currentMinutes === 30)) {
   totalCounter_3 = 0;
  }
  if (poin === 0) {
    counter_3 = 0;
    return 'OK';
  } else if (poin === 1 && counter_3 !== maxPoin_3) {
    counter_3++;
    totalCounter_3++;
    return '';
  } else if (counter_3 === maxPoin_3) {
    counter_3++;
    totalCounter_3++;
    return 'SCAN BARCODE';
  } else {
    totalCounter_3++;
    return '';
  }
};

const fetchData_3 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(`SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`);
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_3 || JSON.stringify(lastData_3) !== JSON.stringify(data)) {
      lastData_3 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_3(data.COUNT);
      return { ...data, Status: status, Counter: counter_3, TotalCounter: totalCounter_3 };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

app.get('/data3', async (req, res) => {
  const data = await fetchData_3(3); // Menggunakan fetchData_3 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_3, TotalCounter: totalCounter_3 }); // Menggunakan counter_3 dan totalCounter_3
  } else {
    res.status(500).json({ message: 'Internal server error' });
  }
});


let maxPoin_4 = 11;
let counter_4 = -1;
let totalCounter_4 = 0;
let lastData_4 = null; // Menyimpan data terakhir

const getStatus_4 = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_8 menjadi 0
  if ((currentHour === 7 && currentMinutes === 0) || (currentHour === 21 && currentMinutes === 30)) {
   totalCounter_4 = 0;
  }
  if (poin === 0) {
    counter_4 = 0;
    return 'OK';
  } else if (poin === 1 && counter_4 !== maxPoin_4) {
    counter_4++;
    totalCounter_4++;
    return '';
  } else if (counter_4 === maxPoin_4) {
    counter_4++;
    totalCounter_4++;
    return 'SCAN BARCODE';
  } else {
    totalCounter_4++;
    return '';
  }
};

const fetchData_4 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(`SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`);
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_4 || JSON.stringify(lastData_4) !== JSON.stringify(data)) {
      lastData_4 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_4(data.COUNT);
      return { ...data, Status: status, Counter: counter_4, TotalCounter: totalCounter_4 };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

app.get('/data4', async (req, res) => {
  const data = await fetchData_4(4); // Menggunakan fetchData_4 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_4, TotalCounter: totalCounter_4 }); // Menggunakan counter_4 dan totalCounter_4
  } else {
    res.status(500).json({ message: 'Internal server error' });
  }
});


let maxPoin_5 = 11;
let counter_5 = -1;
let totalCounter_5 = 0;
let lastData_5 = null; // Menyimpan data terakhir

const getStatus_5 = (poin) => {
   // Mendapatkan waktu saat ini
   const currentTime = new Date();
   const currentHour = currentTime.getHours();
   const currentMinutes = currentTime.getMinutes();
 
   // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_8 menjadi 0
   if ((currentHour === 7 && currentMinutes === 0) || (currentHour === 21 && currentMinutes === 30)) {
    totalCounter_5 = 0;
   }
  if (poin === 0) {
    counter_5 = 0;
    return 'OK';
  } else if (poin === 1 && counter_5 !== maxPoin_5) {
    counter_5++;
    totalCounter_5++;
    return '';
  } else if (counter_5 === maxPoin_5) {
    counter_5++;
    totalCounter_5++;
    return 'SCAN BARCODE';
  } else {
    totalCounter_5++;
    return '';
  }
};

const fetchData_5 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(`SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`);
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_5 || JSON.stringify(lastData_5) !== JSON.stringify(data)) {
      lastData_5 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_5(data.COUNT);
      return { ...data, Status: status, Counter: counter_5, TotalCounter: totalCounter_5 };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

app.get('/data5', async (req, res) => {
  const data = await fetchData_5(5); // Menggunakan fetchData_5 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_5, TotalCounter: totalCounter_5 }); // Menggunakan counter_5 dan totalCounter_5
  } else {
    res.status(500).json({ message: 'Internal server error' });
  }
});

let maxPoin_8 = 11;
let counter_8 = -1;
let totalCounter_8 = 0;
let lastData_8 = null; // Menyimpan data terakhir

const getStatus_8 = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_8 menjadi 0
  if ((currentHour === 7 && currentMinutes === 0) || (currentHour === 21 && currentMinutes === 30)) {
    totalCounter_8 = 0;
  }
  if (poin === 0) {
    counter_8 = 0;
    return 'OK';
  } else if (poin === 1 && counter_8 !== maxPoin_8) {
    counter_8++;
    totalCounter_8++;
    return '';
  } else if (counter_8 === maxPoin_8) {
    counter_8++;
    totalCounter_8++;
    return 'SCAN BARCODE';
  } else {
    totalCounter_8++;
    return '';
  }
};

const fetchData_8 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(`SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`);
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_8 || JSON.stringify(lastData_8) !== JSON.stringify(data)) {
      lastData_8 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_8(data.COUNT);
      return { ...data, Status: status, Counter: counter_8, TotalCounter: totalCounter_8 };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

app.get('/data8', async (req, res) => {
  const data = await fetchData_8(8); // Menggunakan fetchData_8 dan memberikan argumen 8
  if (data) {
    res.json({ ...data, Counter: counter_8, TotalCounter: totalCounter_8 }); // Menggunakan counter_8 dan totalCounter_8
  } else {
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

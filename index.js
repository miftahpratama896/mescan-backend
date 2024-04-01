const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mssql = require("mssql");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3003;

const config = {
  user: "sa",
  password: "Pai2015",
  server: "172.16.200.28",
  database: "JX2ENG",
  options: {
    trustServerCertificate: true,
  },
};

app.use(cors());
let pool;
let maxPoin_5 = 11;
let counter_5 = -1;
let totalCounter_5 = 0;
let lastData_5 = null; // Menyimpan data terakhir
const currentTime = new Date();
const currentHour = currentTime.getHours();
const currentMinutes = currentTime.getMinutes();

const getStatus_5 = (poin) => {
  if (poin === 0) {
    counter_5 = 0;
    return "OK";
  } else if (poin === 1 && counter_5 !== maxPoin_5) {
    counter_5++;
    return "";
  } else if (counter_5 === maxPoin_5) {
    counter_5++;
    return "SCAN BARCODE";
  } else {
    return "";
  }
};

const fetchData_5 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT, CELL FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];
    // Query kedua
    const result2 = await request.query(
      `SELECT MODEL, COMPONENT, SIZE, MATERIAL FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
    );
    const additionalInfo = result2.recordset[0];

    const date = new Date()
    const yesterdayDate = new Date(new Date().setDate(new Date().getDate() - 1));

    const result_monitoring_sizeYesterday = await request.query(
      `SELECT * FROM MAIN_MONITORING_SIZE_CUTT WHERE BARCODE = '${data.BARCODE}' AND DATE = '${yesterdayDate.toISOString()}'`
    );
    const monitoring_sizeYesterday_data = result_monitoring_sizeYesterday.recordset[0];

    const result_monitoring_size = await request.query(
      `SELECT * FROM MAIN_MONITORING_SIZE_CUTT WHERE BARCODE = '${data.BARCODE}' AND DATE = '${date.toISOString()}'`
    );
    const monitoring_size_data = result_monitoring_size.recordset[0];

    const checkTotalActual = await request.query(`SELECT * FROM SPK_CUTTING WHERE CUTT_PROCESS_DATE = '${yesterdayDate.toISOString()}' AND TOTAL_DAILY_PLAN = TOTAL_DAILY_ACTUAL`);

    const checkTotalActualData = checkTotalActual.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_5 || JSON.stringify(lastData_5) !== JSON.stringify(data)) {
      const status = getStatus_5(data.COUNT);
      const hour = String(new Date().getHours()).padStart(2, "0");
      const minutes = String(new Date().getMinutes()).padStart(2, "0");
      const time = `${hour}:${minutes}`;

      // Mendefinisikan jam yang diizinkan untuk penyisipan (ketika menit adalah 00)
      const isAllowedTime = currentMinutes === 25;


      if (!checkTotalActualData && counter_5 !== 0) {
        const updateYesterday = await request.query(`UPDATE SPK_CUTTING SET TOTAL_DAILY_ACTUAL = TOTAL_DAILY_ACTUAL + 1 WHERE CUTT_PROCESS_DATE = '${yesterdayDate.toISOString()}' AND
        MODEL = '${additionalInfo.MODEL}' AND COMPONENT = '${additionalInfo.COMPONENT}'`)
        if (!monitoring_sizeYesterday_data) {
          // Jika tidak ada data dengan BARCODE yang sama pada tanggal hari ini, jalankan query input
          const input = await request.query(
            `INSERT INTO MAIN_MONITORING_SIZE_CUTT (LINE, NO_MACHINE, BARCODE, SIZE, TOTAL_COUNTER_BARCODE, DATE) 
            VALUES (${data.CELL},${data.NO_MC}, '${data.BARCODE}', '${additionalInfo.SIZE}', 1, '${yesterdayDate.toISOString()}')`
          );
        } else {
          // Jika sudah ada data dengan BARCODE yang sama pada tanggal hari ini, jalankan query update
          const update = await request.query(
            `UPDATE MAIN_MONITORING_SIZE_CUTT SET TOTAL_COUNTER_BARCODE = TOTAL_COUNTER_BARCODE + 1 
            WHERE BARCODE = '${data.BARCODE}' AND DATE = '${yesterdayDate.toISOString()}'`
          );
        }
      } 
      if (checkTotalActualData && counter_5 !== 0) {
        const updateToday = await request.query(`UPDATE SPK_CUTTING SET TOTAL_DAILY_ACTUAL = TOTAL_DAILY_ACTUAL + 1 WHERE CUTT_PROCESS_DATE = '${date.toISOString()}' AND
        MODEL = '${additionalInfo.MODEL}' AND COMPONENT = '${additionalInfo.COMPONENT}'`)
        if (!monitoring_size_data) {
          // Jika tidak ada data dengan BARCODE yang sama pada tanggal hari ini, jalankan query input
          const input = await request.query(
            `INSERT INTO MAIN_MONITORING_SIZE_CUTT (LINE, NO_MACHINE, BARCODE, SIZE, TOTAL_COUNTER_BARCODE, DATE) 
            VALUES (${data.CELL},${data.NO_MC}, '${data.BARCODE}', '${additionalInfo.SIZE}', 1, '${date.toISOString()}')`
          );
        } else {
          // Jika sudah ada data dengan BARCODE yang sama pada tanggal hari ini, jalankan query update
          const update = await request.query(
            `UPDATE MAIN_MONITORING_SIZE_CUTT SET TOTAL_COUNTER_BARCODE = TOTAL_COUNTER_BARCODE + 1 
            WHERE BARCODE = '${data.BARCODE}' AND DATE = '${date.toISOString()}'`
          );
        }
      }

      if (!lastData_5 || lastData_5.BARCODE !== data.BARCODE || isAllowedTime) {
        const input = await request.query(
          `INSERT INTO MAIN_MONITORING_CUTT (NO_MACHINE, BARCODE, DATE, HOUR, MODEL, COMPONENT, SIZE, COUNTER, TOTAL_COUNTER) 
        VALUES (${noMC}, '${data.BARCODE
          }', '${new Date().toISOString()}', '${time}', '${additionalInfo.MODEL
          }', '${additionalInfo.COMPONENT}', '${additionalInfo.SIZE
          }', ${counter_5}, (SELECT ISNULL(MAX(TOTAL_COUNTER), 0) FROM MAIN_MONITORING_CUTT WHERE NO_MACHINE = ${noMC}))
        `
        );
      }
      if (counter_5 !== 0) {
        const update = await request.query(
          `UPDATE MAIN_MONITORING_CUTT 
       SET 
       COUNTER = ${counter_5}, 
           TOTAL_COUNTER = TOTAL_COUNTER + 1
           WHERE NO_MACHINE = ${noMC} AND BARCODE = '${data.BARCODE}' AND HOUR = (
            SELECT MAX(HOUR) 
            FROM MAIN_MONITORING_CUTT 
            WHERE NO_MACHINE = ${noMC}
        )`
        );
      }
      if (new Date().getHours() === 11 && new Date().getMinutes() === 22) {
        const input = await request.query(
          `INSERT INTO MAIN_MONITORING_CUTT (NO_MACHINE, BARCODE, DATE, HOUR, MODEL, COMPONENT, SIZE, COUNTER, TOTAL_COUNTER) 
        VALUES (${noMC}, '${data.BARCODE
          }', '${new Date().toISOString()}', '${time}', '${additionalInfo.MODEL
          }', '${additionalInfo.COMPONENT}', '${additionalInfo.SIZE
          }', ${counter_5}, 0)
        `
        );
      }
      lastData_5 = data; // Menyimpan data saat ini sebagai data terakhir
      // Query ketiga
      const result3 = await request.query(
        `SELECT TOTAL_COUNTER FROM MAIN_MONITORING_CUTT WHERE NO_MACHINE = ${noMC} AND BARCODE = '${data.BARCODE}' ORDER BY TOTAL_COUNTER DESC`
      );
      const additionalInfo3 = result3.recordset[0];

      return {
        ...data,
        Status: status,
        Counter: counter_5,
        TotalCounter: totalCounter_5,
        AdditionalInfo: additionalInfo,
        AdditionalInfo3: additionalInfo3,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

let intervalId; // Deklarasikan variabel interval di luar blok koneksi

wss.on("connection", (ws) => {
  console.log("Client connected");

  if (!intervalId) {
    intervalId = setInterval(async () => {
      const data = await fetchData_5(5);
      if (data) {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ ...data, Counter: counter_5, TotalCounter: totalCounter_5 }));
          }
        });
      }
    }, 1000);
  }

  ws.on("close", () => {
    console.log("Client disconnected");
    if (wss.clients.size === 0) { // Memeriksa apakah tidak ada koneksi aktif
      clearInterval(intervalId);
      intervalId = null; // Atur intervalId kembali ke null
    }
  });
});

const sql = require('mssql'); // Tambahkan baris ini

app.use(express.json()); // Middleware untuk menguraikan body permintaan JSON
app.use(express.urlencoded({ extended: true })); // Middleware untuk menguraikan body permintaan URL-encoded

app.post('/input-spk-cutting', async (req, res) => {
  try {
    await sql.connect(config);
    const request = new sql.Request();

    // Data yang akan dimasukkan ke dalam tabel
    const inputData = {
      LINE: req.body.LINE,
      STYLE: req.body.STYLE,
      MODEL: req.body.MODEL,
      COMPONENT: req.body.COMPONENT,
      MATERIAL: req.body.MATERIAL,
      CUTT_PROCESS_DATE: req.body.CUTT_PROCESS_DATE,
      TOTAL_DAILY_PLAN: req.body.TOTAL_DAILY_PLAN,
      TOTAL_DAILY_ACTUAL: req.body.TOTAL_DAILY_ACTUAL
    };

    // Kueri untuk memasukkan data ke dalam tabel
    const query = `
          INSERT INTO SPK_CUTTING 
          (LINE, STYLE, MODEL, COMPONENT, MATERIAL, CUTT_PROCESS_DATE, TOTAL_DAILY_PLAN, TOTAL_DAILY_ACTUAL)
          VALUES 
          (@LINE, @STYLE, @MODEL, @COMPONENT, @MATERIAL, @CUTT_PROCESS_DATE, @TOTAL_DAILY_PLAN, @TOTAL_DAILY_ACTUAL)
      `;

    // Menjalankan kueri dengan parameter yang diisi dengan data yang diterima dari request
    const result = await request
      .input('LINE', sql.Int, inputData.LINE)
      .input('STYLE', sql.VarChar, inputData.STYLE)
      .input('MODEL', sql.VarChar, inputData.MODEL)
      .input('COMPONENT', sql.VarChar, inputData.COMPONENT)
      .input('MATERIAL', sql.VarChar, inputData.MATERIAL)
      .input('CUTT_PROCESS_DATE', sql.Date, inputData.CUTT_PROCESS_DATE)
      .input('TOTAL_DAILY_PLAN', sql.Int, inputData.TOTAL_DAILY_PLAN)
      .input('TOTAL_DAILY_ACTUAL', sql.Int, inputData.TOTAL_DAILY_ACTUAL)
      .query(query);

    res.send('Data berhasil dimasukkan ke dalam tabel SPK_CUTTING.');
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    res.status(500).send('Terjadi kesalahan saat memproses permintaan.');
  }
});

app.get('/barcode-cutt', async (req, res) => {
  try {
    // Membuat koneksi pool
    const pool = await mssql.connect(config);
    // Mengeksekusi query
    const result = await pool.request().query('SELECT * FROM [JX2ENG].[dbo].[BARCODE_CUTT]');
    // Mengirimkan hasil query sebagai respons
    res.json(result.recordset);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Terjadi kesalahan saat memproses permintaan.');
  }
});

server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});

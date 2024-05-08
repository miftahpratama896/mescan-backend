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

    const checkTotalActual = await request.query(`SELECT * FROM [JX2ENG].[dbo].[SPK_CUTTING] WHERE CUTT_PROCESS_DATE = '${yesterdayDate.toISOString()}' AND TOTAL_DAILY_PLAN != TOTAL_DAILY_ACTUAL AND
    MODEL = '${additionalInfo.MODEL}' AND COMPONENT = '${additionalInfo.COMPONENT}' AND LINE = ${data.CELL}`);

    const checkTotalActualData = checkTotalActual.recordset[0];

    const checkTotalActualNow = await request.query(`SELECT * FROM [JX2ENG].[dbo].[SPK_CUTTING] WHERE CUTT_PROCESS_DATE = '${date.toISOString()}' AND TOTAL_DAILY_PLAN != TOTAL_DAILY_ACTUAL AND
    MODEL = '${additionalInfo.MODEL}' AND COMPONENT = '${additionalInfo.COMPONENT}' AND LINE = ${data.CELL}`);

    const checkTotalActualNowData = checkTotalActualNow.recordset[0];


    // Fetch TOTAL ACTUAL by Today Date
    const totalCounter = await request.query(
      `SELECT CUTT_PROCESS_DATE, TOTAL_DAILY_PLAN, TOTAL_DAILY_ACTUAL FROM SPK_CUTTING WHERE CUTT_PROCESS_DATE = '${date.toISOString()}' AND COMPONENT = '${additionalInfo.COMPONENT}' AND MATERIAL = '${additionalInfo.MATERIAL}'`
    );
    const totalCounterData = totalCounter.recordset[0];
    // Fetch TOTAL ACTUAL by Yesterday Date
    const totalCounterYesterday = await request.query(
      `SELECT CUTT_PROCESS_DATE, TOTAL_DAILY_PLAN, TOTAL_DAILY_ACTUAL FROM SPK_CUTTING WHERE CUTT_PROCESS_DATE = '${yesterdayDate.toISOString()}' AND COMPONENT = '${additionalInfo.COMPONENT}' AND MATERIAL = '${additionalInfo.MATERIAL}'`
    );
    const totalCounterYesterdayData = totalCounterYesterday.recordset[0];

    const checkTotalActualNow2 = await request.query(`SELECT * FROM [JX2ENG].[dbo].[SPK_CUTTING] WHERE CUTT_PROCESS_DATE = '${date.toISOString()}' AND
    MODEL = '${additionalInfo.MODEL}' AND COMPONENT = '${additionalInfo.COMPONENT}' AND LINE = ${data.CELL}`);

    const checkTotalActualNowData2 = checkTotalActualNow2.recordset[0];

    // Fetch Size based on No MC, Barcode and Today Date
    const BarcodePerMachine = await request.query(`DECLARE @columns NVARCHAR(MAX), @sql NVARCHAR(MAX);
      
    SELECT @columns = STRING_AGG(QUOTENAME([SIZE]), ', ')
    FROM (
        SELECT DISTINCT [SIZE]
        FROM [dbo].[MAIN_MONITORING_SIZE_CUTT]
    ) AS sizes;
    
    SET @sql = '
    SELECT *
    FROM (
        SELECT [BARCODE], [TOTAL_COUNTER_BARCODE], [SIZE]
        FROM [dbo].[MAIN_MONITORING_SIZE_CUTT]
        WHERE [DATE] = @dateParameter AND [NO_MACHINE] = @machineParameter
        AND [BARCODE] = @barcodeParameter AND [TOTAL_COUNTER_BARCODE] <> 0
    ) AS SourceTable
    PIVOT (
        MAX([TOTAL_COUNTER_BARCODE])
        FOR [SIZE] IN (' + @columns + ')
    ) AS PivotTable;';
  
    EXEC sp_executesql @sql, N'@dateParameter DATE, @machineParameter NVARCHAR(255), @barcodeParameter NVARCHAR(255)',
        @dateParameter = '${date.toISOString()}', @machineParameter = '${noMC}', @barcodeParameter = '${data.BARCODE}';`);
    const BarcodePerMachineData = BarcodePerMachine.recordset[0];


    // Fetch Size based on No MC, Barcode and Yesterday Date
    const BarcodePerMachineYesterday = await request.query(`DECLARE @columns NVARCHAR(MAX), @sql NVARCHAR(MAX);
      
    SELECT @columns = STRING_AGG(QUOTENAME([SIZE]), ', ')
    FROM (
        SELECT DISTINCT [SIZE]
        FROM [dbo].[MAIN_MONITORING_SIZE_CUTT]
    ) AS sizes;
    
    SET @sql = '
    SELECT *
    FROM (
        SELECT [BARCODE], [TOTAL_COUNTER_BARCODE], [SIZE]
        FROM [dbo].[MAIN_MONITORING_SIZE_CUTT]
        WHERE [DATE] = @dateParameter AND [NO_MACHINE] = @machineParameter
        AND [BARCODE] = @barcodeParameter AND [TOTAL_COUNTER_BARCODE] <> 0
    ) AS SourceTable
    PIVOT (
        MAX([TOTAL_COUNTER_BARCODE])
        FOR [SIZE] IN (' + @columns + ')
    ) AS PivotTable;';
  
    EXEC sp_executesql @sql, N'@dateParameter DATE, @machineParameter NVARCHAR(255), @barcodeParameter NVARCHAR(255)',
        @dateParameter = '${yesterdayDate.toISOString()}', @machineParameter = '${noMC}', @barcodeParameter = '${data.BARCODE}';`);
    const BarcodePerMachineYesterdayData = BarcodePerMachineYesterday.recordset[0];

    const BarcodePerMachineTest = await request.query(`DECLARE @columns NVARCHAR(MAX), @sql NVARCHAR(MAX);
      
    SELECT @columns = STRING_AGG(QUOTENAME([SIZE]), ', ')
    FROM (
        SELECT DISTINCT [SIZE]
        FROM [dbo].[MAIN_MONITORING_SIZE_CUTT]
    ) AS sizes;
    
    SET @sql = '
    SELECT TOP 1 *
    FROM (
        SELECT [BARCODE], [TOTAL_COUNTER_BARCODE], [SIZE]
        FROM [dbo].[MAIN_MONITORING_SIZE_CUTT]
        WHERE [NO_MACHINE] = @machineParameter
        AND [BARCODE] = @barcodeParameter AND [TOTAL_COUNTER_BARCODE] <> 0
    ) AS SourceTable
    PIVOT (
        MAX([TOTAL_COUNTER_BARCODE])
        FOR [SIZE] IN (' + @columns + ')
    ) AS PivotTable;';
  
    EXEC sp_executesql @sql, N'@machineParameter NVARCHAR(255), @barcodeParameter NVARCHAR(255)',
         @machineParameter = '${noMC}', @barcodeParameter = '${data.BARCODE}';`);
    const BarcodePerMachineTestData = BarcodePerMachineTest.recordset[0];

    if (checkTotalActualData) {
      MonitoringBarcode = BarcodePerMachineYesterdayData
    } else if (checkTotalActualNowData2) {
      MonitoringBarcode = BarcodePerMachineData
    } else {
      MonitoringBarcode = BarcodePerMachineTestData
    }

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_5 || JSON.stringify(lastData_5) !== JSON.stringify(data)) {
      const status = getStatus_5(data.COUNT);
      const hour = String(new Date().getHours()).padStart(2, "0");
      const minutes = String(new Date().getMinutes()).padStart(2, "0");
      const time = `${hour}:${minutes}`;

      // Mendefinisikan jam yang diizinkan untuk penyisipan (ketika menit adalah 00)
      const isAllowedTime = currentMinutes === 25;


      if (checkTotalActualData && counter_5 !== 0) {
        // update summary jxmes
        const updateYesterday = await request.query(`UPDATE SPK_CUTTING SET TOTAL_DAILY_ACTUAL = TOTAL_DAILY_ACTUAL + 1 WHERE CUTT_PROCESS_DATE = '${yesterdayDate.toISOString()}' AND
        MODEL = '${additionalInfo.MODEL}' AND COMPONENT = '${additionalInfo.COMPONENT}' AND LINE = ${data.CELL}`)
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
      else if (checkTotalActualNowData2 && counter_5 !== 0) {
        // update summary jxmes
        const updateToday = await request.query(`UPDATE SPK_CUTTING SET TOTAL_DAILY_ACTUAL = TOTAL_DAILY_ACTUAL + 1 WHERE CUTT_PROCESS_DATE = '${date.toISOString()}' AND
        MODEL = '${additionalInfo.MODEL}' AND COMPONENT = '${additionalInfo.COMPONENT}' AND LINE = ${data.CELL}`)
        if (!monitoring_size_data ) {
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
      } else {
        if (!monitoring_size_data && counter_5 !== 0) {
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

      lastData_5 = data; // Menyimpan data saat ini sebagai data terakhir

      if (checkTotalActualData) {
        hasil = totalCounterYesterdayData
      }
      else if (checkTotalActualNowData) {
        hasil = totalCounterData
      }


      return {
        ...data,
        Status: status,
        Counter: counter_5,
        TotalCounter: hasil,
        AdditionalInfo: additionalInfo,
        AdditionalInfo3: MonitoringBarcode,
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
      const data = await fetchData_5(11);
      if (data) {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ ...data, Counter: counter_5, AdditionalInfo3: MonitoringBarcode }));
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
          (ID, LINE, STYLE, MODEL, COMPONENT, MATERIAL, CUTT_PROCESS_DATE, TOTAL_DAILY_PLAN, TOTAL_DAILY_ACTUAL)
          VALUES 
          (NEWID(), @LINE, @STYLE, @MODEL, @COMPONENT, @MATERIAL, @CUTT_PROCESS_DATE, @TOTAL_DAILY_PLAN, @TOTAL_DAILY_ACTUAL)
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
    // Pastikan komponen dan model yang diterima dari permintaan body
    const { COMPONENT, MODEL } = req.body;
    
    // Jika tidak ada komponen dan model, tampilkan semua data
    if (!COMPONENT && !MODEL) {
      // Membuat koneksi pool
      const pool = await mssql.connect(config);
      // Mengeksekusi query tanpa WHERE clause
      const result = await pool.request().query(`SELECT [BARCODE]
      ,[MODEL]
      ,[COMPONENT]
      ,[SIZE]
      ,[MATERIAL]
       FROM [JX2ENG].[dbo].[BARCODE_CUTT]`);
      // Mengirimkan hasil query sebagai respons
      return res.json(result.recordset);
    }

    // Membuat koneksi pool
    const pool = await mssql.connect(config);
    let queryString = `SELECT [BARCODE]
    ,[MODEL]
    ,[COMPONENT]
    ,[SIZE]
    ,[MATERIAL]
     FROM [JX2ENG].[dbo].[BARCODE_CUTT] WHERE `;
     
    let conditions = [];

    // Jika terdapat komponen, tambahkan kondisi WHERE untuk COMPONENT
    if (COMPONENT) {
      conditions.push(`[COMPONENT] = '${COMPONENT}'`);
    }

    // Jika terdapat model, tambahkan kondisi WHERE untuk MODEL
    if (MODEL) {
      conditions.push(`[MODEL] = '${MODEL}'`);
    }

    // Gabungkan semua kondisi dengan operator AND
    queryString += conditions.join(' AND ');

    // Mengeksekusi query dengan WHERE clause untuk COMPONENT dan MODEL
    const result = await pool.request().query(queryString);
    // Mengirimkan hasil query sebagai respons
    res.json(result.recordset);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Terjadi kesalahan saat memproses permintaan.');
  }
});


app.get('/spk-cutt', async (req, res) => {
  try {
    let query = `
      SELECT
          [ID]
          ,[LINE]
          ,[STYLE]
          ,[MODEL]
          ,[COMPONENT]
          ,[MATERIAL]
          ,[CUTT_PROCESS_DATE]
          ,[TOTAL_DAILY_PLAN]
          ,[TOTAL_DAILY_ACTUAL]
      FROM [JX2ENG].[dbo].[SPK_CUTTING]
    `;

    // Menyiapkan array untuk menyimpan kondisi filter
    const filters = [];

    // Jika LINE tidak kosong, tambahkan filter WHERE
    if (req.query.LINE && req.query.LINE !== '0') {
      const line = typeof req.query.LINE === 'string' ? `'${req.query.LINE}'` : req.query.LINE;
      filters.push(`[LINE] = ${line}`);
    }

    // Jika CUTT_PROCESS_DATE tidak kosong, tambahkan filter WHERE
    if (req.query.CUTT_PROCESS_DATE) {
      const cuttDate = new Date(req.query.CUTT_PROCESS_DATE).toISOString();
      filters.push(`[CUTT_PROCESS_DATE] = '${cuttDate}'`);
    }

    // Gabungkan semua kondisi filter menjadi satu string
    if (filters.length > 0) {
      query += ' WHERE ' + filters.join(' AND ');
    }

    // Membuat koneksi database
    await sql.connect(config);

    // Query SQL untuk mengambil data
    const result = await sql.query(query);

    // Mengirimkan data sebagai respons
    res.json(result.recordset);
  } catch (err) {
    // Menangani kesalahan jika ada
    console.error('Error occurred:', err);
    res.status(500).send('Internal Server Error');
  }
});



app.put('/spk-cutt-update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { LINE, STYLE, MODEL, COMPONENT, MATERIAL, CUTT_PROCESS_DATE, TOTAL_DAILY_PLAN, TOTAL_DAILY_ACTUAL } = req.body;

    // Membuat koneksi database
    await sql.connect(config);

    // Query SQL untuk mengupdate data
    const result = await sql.query(`
          UPDATE [JX2ENG].[dbo].[SPK_CUTTING]
          SET LINE = '${LINE}',
              STYLE = '${STYLE}',
              MODEL = '${MODEL}',
              COMPONENT = '${COMPONENT}',
              MATERIAL = '${MATERIAL}',
              CUTT_PROCESS_DATE = '${CUTT_PROCESS_DATE}',
              TOTAL_DAILY_PLAN = ${TOTAL_DAILY_PLAN},
              TOTAL_DAILY_ACTUAL = ${TOTAL_DAILY_ACTUAL}
          WHERE ID = '${id}'
      `);

    // Mengirimkan pesan berhasil jika berhasil mengupdate
    if (result.rowsAffected > 0) {
      res.status(200).send('Data updated successfully.');
    } else {
      res.status(404).send('Data not found.');
    }
  } catch (err) {
    // Menangani kesalahan jika ada
    console.error('Error occurred:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/monitoring-barcode', async (req, res) => {
  try {
    // Membuat koneksi database
    await sql.connect(config);

    // Menyiapkan query SQL dasar
    let query = `
      SELECT [LINE]
      ,[NO_MACHINE]
      ,[BARCODE]
      ,[SIZE]
      ,[TOTAL_COUNTER_BARCODE]
      ,[DATE]
      FROM [JX2ENG].[dbo].[MAIN_MONITORING_SIZE_CUTT]
    `;

    // Menyiapkan array untuk menyimpan kondisi filter
    const filters = [];

    // Jika LINE tidak kosong, tambahkan filter WHERE
    if (req.query.LINE && req.query.LINE !== '0') {
      const line = typeof req.query.LINE === 'string' ? `'${req.query.LINE}'` : req.query.LINE;
      filters.push(`[LINE] = ${line}`);
    }

    // Jika DATE tidak kosong, tambahkan filter WHERE
    if (req.query.DATE) {
      const date = new Date(req.query.DATE).toISOString();
      filters.push(`[DATE] = '${date}'`);
    }

    // Gabungkan semua kondisi filter menjadi satu string
    if (filters.length > 0) {
      query += ' WHERE ' + filters.join(' AND ');
    }

    // Query SQL untuk mengambil data
    const result = await sql.query(query);

    // Mengirimkan data sebagai respons
    res.json(result.recordset);
  } catch (err) {
    // Menangani kesalahan jika ada
    console.error('Error occurred:', err);
    res.status(500).send('Internal Server Error');
  }
});



server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});

const express = require("express");
const mssql = require("mssql");
const cors = require("cors");

const app = express();
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
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter = 0;
  }
  if (poin === 0) {
    counter = 0;
    return "OK";
  } else if (poin === 1 && counter !== maxPoin) {
    counter++;
    totalCounter++;
    return "";
  } else if (counter === maxPoin) {
    counter++;
    totalCounter++;
    return "SCAN BARCODE";
  } else {
    totalCounter++;
    return "";
  }
};

const fetchData = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];
    // Query kedua
    const result2 = await request.query(
      `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
    );
    const additionalInfo = result2.recordset[0];
    const hour = String(new Date().getHours()).padStart(2, "0");
    const minutes = String(new Date().getMinutes()).padStart(2, "0");
    const time = `${hour}:${minutes}`;

    // Mendefinisikan jam yang diizinkan untuk penyisipan (ketika menit adalah 00)
    const isAllowedTime = minutes === "00";

    if (
      totalCounter === 1 ||
      !lastData ||
      lastData.BARCODE !== data.BARCODE ||
      isAllowedTime
    ) {
      const input = await request.query(
        `INSERT INTO MAIN_MONITORING_CUTT (NO_MACHINE, BARCODE, DATE, HOUR, MODEL, COMPONENT, SIZE, COUNTER, TOTAL_COUNTER) 
        VALUES (${noMC},'${
          data.BARCODE
        }','${new Date().toISOString()}','${time}', '${
          additionalInfo.MODEL
        }','${additionalInfo.COMPONENT}', '${
          additionalInfo.SIZE
        }', ${counter}, ${totalCounter} )`
      );
    } else {
      const update = await request.query(
        `UPDATE MAIN_MONITORING_CUTT 
         SET 
         COUNTER = ${counter}, 
             TOTAL_COUNTER = ${totalCounter}
             WHERE NO_MACHINE = ${noMC} AND BARCODE = '${data.BARCODE}' AND HOUR = (
              SELECT MAX(HOUR) 
              FROM MAIN_MONITORING_CUTT 
              WHERE NO_MACHINE = ${noMC}
          )`
      );
    }

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData || JSON.stringify(lastData) !== JSON.stringify(data)) {
      lastData = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus(data.COUNT);

      return {
        ...data,
        Status: status,
        Counter: counter,
        TotalCounter: totalCounter,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data1", async (req, res) => {
  const data = await fetchData(1);
  if (data) {
    res.json({ ...data, Counter: counter, TotalCounter: totalCounter });
  } else {
    res.status(500).json({ message: "Internal server error" });
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
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_2 = 0;
  }
  if (poin === 0) {
    counter_2 = 0;
    return "OK";
  } else if (poin === 1 && counter_2 !== maxPoin_2) {
    counter_2++;
    totalCounter_2++;
    return "";
  } else if (counter_2 === maxPoin_2) {
    counter_2++;
    totalCounter_2++;
    return "SCAN BARCODE";
  } else {
    totalCounter_2++;
    return "";
  }
};

const fetchData_2 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_2 || JSON.stringify(lastData_2) !== JSON.stringify(data)) {
      lastData_2 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_2(data.COUNT);

      // Query kedua
      const result2 = await request.query(
        `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
      );
      const additionalInfo = result2.recordset[0];

      return {
        ...data,
        Status: status,
        Counter: counter_2,
        TotalCounter: totalCounter_2,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data2", async (req, res) => {
  const data = await fetchData_2(2); // Menggunakan fetchData_2 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_2, TotalCounter: totalCounter_2 }); // Menggunakan counter_2 dan totalCounter_2
  } else {
    res.status(500).json({ message: "Internal server error" });
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
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_3 = 0;
  }
  if (poin === 0) {
    counter_3 = 0;
    return "OK";
  } else if (poin === 1 && counter_3 !== maxPoin_3) {
    counter_3++;
    totalCounter_3++;
    return "";
  } else if (counter_3 === maxPoin_3) {
    counter_3++;
    totalCounter_3++;
    return "SCAN BARCODE";
  } else {
    totalCounter_3++;
    return "";
  }
};

const fetchData_3 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_3 || JSON.stringify(lastData_3) !== JSON.stringify(data)) {
      lastData_3 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_3(data.COUNT);

      // Query kedua
      const result2 = await request.query(
        `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
      );
      const additionalInfo = result2.recordset[0];

      return {
        ...data,
        Status: status,
        Counter: counter_3,
        TotalCounter: totalCounter_3,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data3", async (req, res) => {
  const data = await fetchData_3(3); // Menggunakan fetchData_3 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_3, TotalCounter: totalCounter_3 }); // Menggunakan counter_3 dan totalCounter_3
  } else {
    res.status(500).json({ message: "Internal server error" });
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
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_4 = 0;
  }
  if (poin === 0) {
    counter_4 = 0;
    return "OK";
  } else if (poin === 1 && counter_4 !== maxPoin_4) {
    counter_4++;
    totalCounter_4++;
    return "";
  } else if (counter_4 === maxPoin_4) {
    counter_4++;
    totalCounter_4++;
    return "SCAN BARCODE";
  } else {
    totalCounter_4++;
    return "";
  }
};

const fetchData_4 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];
    // Query kedua
    const result2 = await request.query(
      `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
    );
    const additionalInfo = result2.recordset[0];

    const hour = String(new Date().getHours()).padStart(2, "0");
    const minutes = String(new Date().getMinutes()).padStart(2, "0");
    const time = `${hour}:${minutes}`;

    // Mendefinisikan jam yang diizinkan untuk penyisipan (ketika menit adalah 00)
    const isAllowedTime = minutes === "00";

    if (
      totalCounter_4 === 1 ||
      !lastData_4 ||
      lastData_4.BARCODE !== data.BARCODE ||
      isAllowedTime
    ) {
      const input = await request.query(
        `INSERT INTO MAIN_MONITORING_CUTT (NO_MACHINE, BARCODE, DATE, HOUR, MODEL, COMPONENT, SIZE, COUNTER, TOTAL_COUNTER) 
        VALUES (${noMC},'${
          data.BARCODE
        }','${new Date().toISOString()}','${time}', '${
          additionalInfo.MODEL
        }','${additionalInfo.COMPONENT}', '${
          additionalInfo.SIZE
        }', ${counter_4}, ${totalCounter_4} )`
      );
    } else {
      const update = await request.query(
        `UPDATE MAIN_MONITORING_CUTT 
         SET 
         COUNTER = ${counter_4}, 
             TOTAL_COUNTER = ${totalCounter_4}
             WHERE NO_MACHINE = ${noMC} AND BARCODE = '${data.BARCODE}' AND HOUR = (
              SELECT MAX(HOUR) 
              FROM MAIN_MONITORING_CUTT 
              WHERE NO_MACHINE = ${noMC}
          )`
      );
    }

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_4 || JSON.stringify(lastData_4) !== JSON.stringify(data)) {
      lastData_4 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_4(data.COUNT);

      return {
        ...data,
        Status: status,
        Counter: counter_4,
        TotalCounter: totalCounter_4,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data4", async (req, res) => {
  const data = await fetchData_4(4); // Menggunakan fetchData_4 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_4, TotalCounter: totalCounter_4 }); // Menggunakan counter_4 dan totalCounter_4
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
});

let maxPoin_5 = 11;
let counter_5 = -1;
let totalCounter_5 = 0;
let lastData_5 = null; // Menyimpan data terakhir
const currentTime = new Date();
const currentHour = currentTime.getHours();
const currentMinutes = currentTime.getMinutes();
const getStatus_5 = (poin) => {
  // Mendapatkan waktu saat ini
  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_5 menjadi 0
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_5 = 0;
  }
  if (poin === 0) {
    counter_5 = 0;
    return "OK";
  } else if (poin === 1 && counter_5 !== maxPoin_5) {
    counter_5++;
    totalCounter_5++;
    return "";
  } else if (counter_5 === maxPoin_5) {
    counter_5++;
    totalCounter_5++;
    return "SCAN BARCODE";
  } else {
    totalCounter_5++;
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
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];
    // Query kedua
    const result2 = await request.query(
      `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
    );
    const additionalInfo = result2.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_5 || JSON.stringify(lastData_5) !== JSON.stringify(data)) {
      const status = getStatus_5(data.COUNT);
      const hour = String(new Date().getHours()).padStart(2, "0");
      const minutes = String(new Date().getMinutes()).padStart(2, "0");
      const time = `${hour}:${minutes}`;

      // Mendefinisikan jam yang diizinkan untuk penyisipan (ketika menit adalah 00)
      const isAllowedTime = currentMinutes === 25;

      if (!lastData_5 || lastData_5.BARCODE !== data.BARCODE || isAllowedTime) {
        const input = await request.query(
          `INSERT INTO MAIN_MONITORING_CUTT (NO_MACHINE, BARCODE, DATE, HOUR, MODEL, COMPONENT, SIZE, COUNTER, TOTAL_COUNTER) 
        VALUES (${noMC}, '${
            data.BARCODE
          }', '${new Date().toISOString()}', '${time}', '${
            additionalInfo.MODEL
          }', '${additionalInfo.COMPONENT}', '${
            additionalInfo.SIZE
          }', ${counter_5}, (SELECT ISNULL(MAX(TOTAL_COUNTER), 0) FROM MAIN_MONITORING_CUTT WHERE NO_MACHINE = ${noMC}))
        `
        );
      }
      if (counter_5 != 0) {
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
        VALUES (${noMC}, '${
            data.BARCODE
          }', '${new Date().toISOString()}', '${time}', '${
            additionalInfo.MODEL
          }', '${additionalInfo.COMPONENT}', '${
            additionalInfo.SIZE
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

app.get("/data5", async (req, res) => {
  const data = await fetchData_5(5); // Menggunakan fetchData_5 dan memberikan argumen 5
  if (data) {
    res.json({ ...data, Counter: counter_5, TotalCounter: totalCounter_5 }); // Menggunakan counter_5 dan totalCounter_5
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
});

let maxPoin_6 = 11;
let counter_6 = -1;
let totalCounter_6 = 0;
let lastData_6 = null; // Menyimpan data terakhir

const getStatus_6 = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_8 menjadi 0
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_6 = 0;
  }
  if (poin === 0) {
    counter_6 = 0;
    return "OK";
  } else if (poin === 1 && counter_6 !== maxPoin_6) {
    counter_6++;
    totalCounter_6++;
    return "";
  } else if (counter_6 === maxPoin_6) {
    counter_6++;
    totalCounter_6++;
    return "SCAN BARCODE";
  } else {
    totalCounter_6++;
    return "";
  }
};

const fetchData_6 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_6 || JSON.stringify(lastData_6) !== JSON.stringify(data)) {
      lastData_6 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_6(data.COUNT);

      // Query kedua
      const result2 = await request.query(
        `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
      );
      const additionalInfo = result2.recordset[0];

      return {
        ...data,
        Status: status,
        Counter: counter_6,
        TotalCounter: totalCounter_6,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data6", async (req, res) => {
  const data = await fetchData_6(6); // Menggunakan fetchData_6 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_6, TotalCounter: totalCounter_6 }); // Menggunakan counter_6 dan totalCounter_6
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
});

let maxPoin_7 = 11;
let counter_7 = -1;
let totalCounter_7 = 0;
let lastData_7 = null; // Menyimpan data terakhir

const getStatus_7 = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_8 menjadi 0
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_7 = 0;
  }
  if (poin === 0) {
    counter_7 = 0;
    return "OK";
  } else if (poin === 1 && counter_7 !== maxPoin_7) {
    counter_7++;
    totalCounter_7++;
    return "";
  } else if (counter_7 === maxPoin_7) {
    counter_7++;
    totalCounter_7++;
    return "SCAN BARCODE";
  } else {
    totalCounter_7++;
    return "";
  }
};

const fetchData_7 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_7 || JSON.stringify(lastData_7) !== JSON.stringify(data)) {
      lastData_7 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_7(data.COUNT);

      // Query kedua
      const result2 = await request.query(
        `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
      );
      const additionalInfo = result2.recordset[0];

      return {
        ...data,
        Status: status,
        Counter: counter_7,
        TotalCounter: totalCounter_7,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data7", async (req, res) => {
  const data = await fetchData_7(7); // Menggunakan fetchData_7 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_7, TotalCounter: totalCounter_7 }); // Menggunakan counter_7 dan totalCounter_7
  } else {
    res.status(500).json({ message: "Internal server error" });
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
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_8 = 0;
  }
  if (poin === 0) {
    counter_8 = 0;
    return "OK";
  } else if (poin === 1 && counter_8 !== maxPoin_8) {
    counter_8++;
    totalCounter_8++;
    return "";
  } else if (counter_8 === maxPoin_8) {
    counter_8++;
    totalCounter_8++;
    return "SCAN BARCODE";
  } else {
    totalCounter_8++;
    return "";
  }
};

const fetchData_8 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_8 || JSON.stringify(lastData_8) !== JSON.stringify(data)) {
      lastData_8 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_8(data.COUNT);

      // Query kedua
      const result2 = await request.query(
        `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
      );
      const additionalInfo = result2.recordset[0];

      return {
        ...data,
        Status: status,
        Counter: counter_8,
        TotalCounter: totalCounter_8,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data8", async (req, res) => {
  const data = await fetchData_8(8); // Menggunakan fetchData_8 dan memberikan argumen 8
  if (data) {
    res.json({ ...data, Counter: counter_8, TotalCounter: totalCounter_8 }); // Menggunakan counter_8 dan totalCounter_8
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
});

let maxPoin_9 = 11;
let counter_9 = -1;
let totalCounter_9 = 0;
let lastData_9 = null; // Menyimpan data terakhir

const getStatus_9 = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_9 menjadi 0
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_9 = 0;
  }
  if (poin === 0) {
    counter_9 = 0;
    return "OK";
  } else if (poin === 1 && counter_9 !== maxPoin_9) {
    counter_9++;
    totalCounter_9++;
    return "";
  } else if (counter_9 === maxPoin_9) {
    counter_9++;
    totalCounter_9++;
    return "SCAN BARCODE";
  } else {
    totalCounter_9++;
    return "";
  }
};

const fetchData_9 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_9 || JSON.stringify(lastData_9) !== JSON.stringify(data)) {
      lastData_9 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_9(data.COUNT);

      // Query kedua
      const result2 = await request.query(
        `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
      );
      const additionalInfo = result2.recordset[0];

      return {
        ...data,
        Status: status,
        Counter: counter_9,
        TotalCounter: totalCounter_9,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data9", async (req, res) => {
  const data = await fetchData_9(9); // Menggunakan fetchData_9 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_9, TotalCounter: totalCounter_9 }); // Menggunakan counter_9 dan totalCounter_9
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
});

let maxPoin_10 = 11;
let counter_10 = -1;
let totalCounter_10 = 0;
let lastData_10 = null; // Menyimpan data terakhir

const getStatus_10 = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_10 menjadi 0
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_10 = 0;
  }
  if (poin === 0) {
    counter_10 = 0;
    return "OK";
  } else if (poin === 1 && counter_10 !== maxPoin_10) {
    counter_10++;
    totalCounter_10++;
    return "";
  } else if (counter_10 === maxPoin_10) {
    counter_10++;
    totalCounter_10++;
    return "SCAN BARCODE";
  } else {
    totalCounter_10++;
    return "";
  }
};

const fetchData_10 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_10 || JSON.stringify(lastData_10) !== JSON.stringify(data)) {
      lastData_10 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_10(data.COUNT);

      // Query kedua
      const result2 = await request.query(
        `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
      );
      const additionalInfo = result2.recordset[0];

      return {
        ...data,
        Status: status,
        Counter: counter_10,
        TotalCounter: totalCounter_10,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data10", async (req, res) => {
  const data = await fetchData_10(10); // Menggunakan fetchData_10 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_10, TotalCounter: totalCounter_10 }); // Menggunakan counter_10 dan totalCounter_10
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
});

let maxPoin_11 = 11;
let counter_11 = -1;
let totalCounter_11 = 0;
let lastData_11 = null; // Menyimpan data terakhir

const getStatus_11 = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_11 menjadi 0
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_11 = 0;
  }
  if (poin === 0) {
    counter_11 = 0;
    return "OK";
  } else if (poin === 1 && counter_11 !== maxPoin_11) {
    counter_11++;
    totalCounter_11++;
    return "";
  } else if (counter_11 === maxPoin_11) {
    counter_11++;
    totalCounter_11++;
    return "SCAN BARCODE";
  } else {
    totalCounter_11++;
    return "";
  }
};

const fetchData_11 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_11 || JSON.stringify(lastData_11) !== JSON.stringify(data)) {
      lastData_11 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_11(data.COUNT);

      // Query kedua
      const result2 = await request.query(
        `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
      );
      const additionalInfo = result2.recordset[0];

      return {
        ...data,
        Status: status,
        Counter: counter_11,
        TotalCounter: totalCounter_11,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data11", async (req, res) => {
  const data = await fetchData_11(11); // Menggunakan fetchData_11 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_11, TotalCounter: totalCounter_11 }); // Menggunakan counter_11 dan totalCounter_11
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
});

let maxPoin_12 = 11;
let counter_12 = -1;
let totalCounter_12 = 0;
let lastData_12 = null; // Menyimpan data terakhir

const getStatus_12 = (poin) => {
  // Mendapatkan waktu saat ini
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Jika waktu saat ini adalah 07:00 atau 21:30, atur totalCounter_12 menjadi 0
  if (
    (currentHour === 7 && currentMinutes === 0) ||
    (currentHour === 21 && currentMinutes === 30)
  ) {
    totalCounter_12 = 0;
  }
  if (poin === 0) {
    counter_12 = 0;
    return "OK";
  } else if (poin === 1 && counter_12 !== maxPoin_12) {
    counter_12++;
    totalCounter_12++;
    return "";
  } else if (counter_12 === maxPoin_12) {
    counter_12++;
    totalCounter_12++;
    return "SCAN BARCODE";
  } else {
    totalCounter_12++;
    return "";
  }
};

const fetchData_12 = async (noMC) => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
    }
    const request = pool.request();
    const result = await request.query(
      `SELECT TOP 1 DATE, NO_MC, BARCODE, COUNT FROM APS_RAW2 WHERE NO_MC = ${noMC} ORDER BY DATE DESC`
    );
    const data = result.recordset[0];

    // Membandingkan data sebelumnya dengan data saat ini
    if (!lastData_12 || JSON.stringify(lastData_12) !== JSON.stringify(data)) {
      lastData_12 = data; // Menyimpan data saat ini sebagai data terakhir
      const status = getStatus_12(data.COUNT);

      // Query kedua
      const result2 = await request.query(
        `SELECT MODEL, COMPONENT, SIZE FROM BARCODE_CUTT WHERE BARCODE = '${data.BARCODE}'`
      );
      const additionalInfo = result2.recordset[0];

      return {
        ...data,
        Status: status,
        Counter: counter_12,
        TotalCounter: totalCounter_12,
        AdditionalInfo: additionalInfo,
      };
    } else {
      return null; // Mengembalikan null jika data sama dengan data sebelumnya
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

app.get("/data12", async (req, res) => {
  const data = await fetchData_12(12); // Menggunakan fetchData_12 dan memberikan argumen 2
  if (data) {
    res.json({ ...data, Counter: counter_12, TotalCounter: totalCounter_12 }); // Menggunakan counter_12 dan totalCounter_12
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

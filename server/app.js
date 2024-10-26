const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const app = express();

// Configuramos multer para que incluya la extensión original
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `original_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se subió ningún archivo" });
  }

  const audioPath = req.file.path;
  // Aseguramos que el nombre del archivo tenga la extensión .mp3
  const outputPath = path.join(
    __dirname,
    "uploads",
    `converted_${Date.now()}.mp3`
  );

  ffmpeg(audioPath)
    .toFormat("mp3")
    .on("end", () => {
      // Limpiamos el archivo temporal original
      fs.unlink(audioPath, (err) => {
        if (err) console.error("Error al eliminar archivo temporal:", err);
      });

      res.status(200).json({
        message: "Audio convertido exitosamente",
        path: outputPath,
      });
    })
    .on("error", (error) => {
      // Limpiamos el archivo temporal en caso de error
      fs.unlink(audioPath, (err) => {
        if (err) console.error("Error al eliminar archivo temporal:", err);
      });

      console.error("Error de conversión:", error);
      res.status(500).json({ error: "Error al procesar el archivo de audio" });
    })
    .save(outputPath);
});

// Aseguramos que exista el directorio de uploads
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});

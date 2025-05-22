const fs = require('fs');
const express = require('express');
const logger = require('winston');

const DocumentHandler = require('./lib/document_handler.js');
const FileStorage = require('./lib/file_storage.js');

// Config dosyasını oku
const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
config.port = process.env.PORT || config.port || 8080;
config.host = process.env.HOST || config.host || 'localhost';

// Logger ayarları
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { colorize: true, level: 'verbose' });
logger.info('RABEL CODE HASTEBİN ');

// Dosya sistemi nesnesi oluştur
const fileStorage = new FileStorage(config.dataPath);

// Config içindeki dokümanları dosya sisteminden yükle
for (const name in config.documents) {
  const path = config.documents[name];
  try {
    const data = fs.readFileSync(path, 'utf8');
    if (data) {
      fileStorage.set(name, data, function (success) {});
      logger.verbose('Döküman Oluşturuldu: ' + name + " ==> " + path);
    } else {
      logger.warn('Döküman Boş: ' + name + " ==> " + path);
    }
  } catch (err) {
    logger.warn('Döküman Bulunamadi: ' + name + " ==> " + path);
  }
}

// DocumentHandler konfigürasyonu
const documentHandler = new DocumentHandler({
  store: fileStorage,
  maxLength: config.maxLength,
  keyLength: config.keyLength,
  createKey: config.createKey,
});

// Statik dosya sıkıştırma (deploy öncesi yapılmalı!)
// Ancak istersen deploy sırasında da çalıştırabilirsin, dikkat!
// (Alternatif olarak bu kısmı build script'e almanı öneririm)
const CleanCSS = require('clean-css');
const UglifyJS = require('uglify-js');

try {
  const staticFiles = fs.readdirSync(__dirname + '/static');
  staticFiles.forEach((file) => {
    if (file.endsWith('.css') && !file.endsWith('.min.css')) {
      const cssPath = __dirname + '/static/' + file;
      const minCssPath = cssPath.replace('.css', '.min.css');
      const input = fs.readFileSync(cssPath, 'utf8');
      const output = new CleanCSS().minify(input).styles;
      fs.writeFileSync(minCssPath, output, 'utf8');
      logger.verbose(`Sıkıştırıldı: ${file} ==> ${minCssPath}`);
    } else if (file.endsWith('.js') && !file.endsWith('.min.js')) {
      const jsPath = __dirname + '/static/' + file;
      const minJsPath = jsPath.replace('.js', '.min.js');
      const result = UglifyJS.minify(fs.readFileSync(jsPath, 'utf8'));
      if (result.error) {
        logger.warn(`JS sıkıştırma hatası: ${file} => ${result.error}`);
      } else {
        fs.writeFileSync(minJsPath, result.code, 'utf8');
        logger.verbose(`Sıkıştırıldı: ${file} ==> ${minJsPath}`);
      }
    }
  });
} catch (err) {
  logger.warn('Statik dosya sıkıştırma sırasında hata: ' + err.message);
}

// Express app oluştur
const app = express();

app.get('/raw/:id', (req, res) => {
  return documentHandler.handleRawGet(req.params.id, res);
});

app.post('/documents', (req, res) => {
  return documentHandler.handlePost(req, res);
});

app.get('/documents/:id', (req, res) => {
  return documentHandler.handleGet(req.params.id, res);
});

app.use(express.static('static'));

app.get('/:id', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});

// Vercel için app.listen yok, modülü export et
// app.listen(config.port, config.host);

module.exports = app;

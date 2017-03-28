var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('scanning barcode...');	
});

router.get('/', function(req, res, next) {
  res.send('ab+cd');
});

module.exports = router;

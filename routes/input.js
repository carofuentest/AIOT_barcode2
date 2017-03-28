var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/input', function(req, res, next) {
  res.send('input page');	
});



module.exports = router;

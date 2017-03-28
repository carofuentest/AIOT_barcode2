var express = require('express');
var router = express.Router();
var i = 0;


function getResults(cb){
    cb('<div>Result '+(i++)+'</div><div>Result '+(i++)+'</div><div>Result '+(i++)+'</div>');
}

//router.set('view engine','jade');
router.get('/', function(req,res){
    res.getResults(function(results){   
        res.render('page',{results:results});
    });
});

router.get('/results',function(req,res){
    res.getResults(function(results){       
        res.writeHead(200,'OK',{'Content-Type': 'text/html'});
        res.end(results);
    });
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('input2 test..');	
});


//var app = express();
//app.set('view engine','jade');
//app.get('/',function(req,res){
//    getResults(function(results){   
//        res.render('page',{results:results});
//    });
//});
//app.get('/results',function(req,res){
//    getResults(function(results){       
//        res.writeHead(200,'OK',{'Content-Type':'text/html'});
//        res.end(results);
//    });
//});

//app.listen(80);


module.exports = router;
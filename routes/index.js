var express = require('express');
var router = express.Router();
var app = express();
var request = require('request');
var https = require('https');
var bodyParser = require('body-parser');
var moment = require('moment');
const util = require('util')

var eanSelected = 0;



/******** EAN CODE ********/

/* GET New EAN page. */
router.get('/newEan', function(req, res) {
    res.render('newEan', { title: 'Add New EAN' });
});


/* GET EAN list page. */  
router.get('/eanlist', function(req, res) {
    var db = req.db;		//definicion de app.js 
    var collection = db.get('eanCollection');  //coleccion similar a tabla
    collection.find({},{},function(e,docs){
        console.log('***1:',docs);
        console.log('# docs:',docs.length);
        console.log('**codenumber:', docs.codetype);

        res.render('eanlist', { "eanlist" : docs, moment: moment});

});
});    




/* POST to Add EAN code */
router.post('/addean', function(req, res) {
    // Set our internal DB variable
    var db = req.db;
    var eanCode = req.body.eancode;
    var collection = db.get('eanCollection');
    var eanSelected = eanCode;//'0'+ eanCode;

    var collectionDocument = connectTesco(eanSelected,req,res); 
    console.log(collectionDocument);
    
});




/***  function to connect and consume TESCO API  ****/

function connectTesco(eanSelected,req,res){
    
    eanSelected1 = '0'+ eanSelected;
    var options = {
        method: 'GET', 
        hostname: 'dev.tescolabs.com',   
        //url: 'https://dev.tescolabs.com/product/?gtin=04548736003446', //05022996000135',
        url: 'https://dev.tescolabs.com/product/?gtin='+eanSelected1, //05022996000135',
        headers: {
        'Ocp-Apim-Subscription-Key': 'd00f3cbe704e4aec8aa8fb91b94d43f0'
        },
        rejectUnauthorized: false
        };

    request(options, function (error, response, body) {
    if (!error) {
        console.log('*statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        //var productsTesco = JSON.parse(body);
        var productsTesco = body;
        console.log('** detalle producto:**'+productsTesco);
        if (Object.keys(productsTesco).length==22) {
            //console.log('valor nulo');
            var jsonObj = { 'products': [ { 'description': 'N/A', 'brand': 'N/A' } ] };
            var jsonObj = JSON.stringify(jsonObj);
            //console.log(jsonObj); 
            storeData2(eanSelected,jsonObj,req,res);

        }else{
            storeData2(eanSelected,body,req,res);
        }
        //console.log('valor:'+Object.keys(productsTesco).length); 
        
        
    }else{
        console.log('error:', error); 
        console.log('statusCode:', response && response.statusCode); 
        console.log('body:', body);
        return false;

    }
    
});
}
   



//****************************

function storeData2(eancode,jsonBody,req,res){
    //function to store data as json into eanCollection collection
    var db = req.db;
    var eanCode = eancode;
    var eanCollection = db.get('eanCollection');
    var collectionDocument = JSON.parse(jsonBody);
    var dataCollection = {
        "codenumber": eanCode, 
        "codetype": 'EAN-13', 
        "timestamp": [new Date()], // o new Date().valueOf(), 
        //"timestamp": new Date().getTime(),
        "products": collectionDocument.products[0]
    };
    

    eanCollection.findOne({codenumber: eanCode}, function(err, result) {
        if (err) { /* handle err */ }
        if (result) {
            console.log('we have a result');
            //if we have a result(a eancode registered before), then we update data

            eanCollection.update(
            {codenumber: eanCode}, // query
            { $push: {
                  timestamp:{ $each: [new Date()]
                  }
                }
            },

            function(err, object) {
                if (err){
                console.log(err.message);  // returns error if no matching object found
            }else{
                console.log("***product updated into db ***")
                res.redirect("newEan")
            }
            });

        } else {
            console.log('we don´t have a result');
            //we Submit to the DB into a collection the new product
            eanCollection.insert(dataCollection, function (err, doc) {
                if (err) {
                    // If it failed, return error
                    console.log(err)
                    res.send("There was a problem adding the information to the database.");
                }
                else {
                    // And forward to success page
                    console.log("***product stored into db ***")
                    res.redirect("newEan")

                }
            });
        }
    });
}

//****************************




/**** GET EAN details From TESCO****/

router.get('/eandetail', function(req, res) {
    var eanSelected = '0'+req.param('eanSelected');
    var options = {
        method: 'GET', 
        hostname: 'dev.tescolabs.com',   
        url: 'https://dev.tescolabs.com/product/?gtin='+eanSelected, //05022996000135',
        headers: {
        'Ocp-Apim-Subscription-Key': 'd00f3cbe704e4aec8aa8fb91b94d43f0'
        },
        rejectUnauthorized: false
        };

    request(options, function (error, response, body) {
    if (!error) {
        console.log('*statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        var productsTesco = JSON.parse(body);
        
        function isEmpty(){
            if(productsTesco.products[0]){
                console.log('info:',productsTesco.products[0]);
                return false;
            }
            else{
                return true; 
            }
        }

        if(isEmpty()){
            res.render('tescodata', { title: 'Sorry! :( This product is not from Tesco' });//testing the route
        }
        else{
            for(productsInfo in productsTesco.products[0]){
                console.log(productsInfo+":"+productsTesco.products[0][productsInfo]);
                //here create a loop to generate a res.render table with all JSON data
            }
            //res.render('eandetail', {title: 'Product Description:'+productsTesco["products"][0]["description"]});
            //console.log(productsTesco["products"][0]["productCharacteristics"]["isFood"]);
            //console.log(productsTesco);
            res.render('eandetail', { 
                title: 'Product Detail', 
                prdName: productsTesco["products"][0]["description"],
                prdBrand: productsTesco["products"][0]["brand"],
                prdChar: 'Food:'+ productsTesco["products"][0]["productCharacteristics"]["isFood"]+'/'+'Drink:'+productsTesco["products"][0]["productCharacteristics"]["isDrink"],
                prdHealth: productsTesco["products"][0]["productCharacteristics"]["healthScore"],
                prdIngr: productsTesco["products"][0]["ingredients"],
                prdNutr: 'xx',
                prdQty: productsTesco["products"][0]["qtyContents"], //["netContents"],
                prdBestDate: '*** best before dd/mm/yyyy ***',
                prdUseDate: '*** Use by dd/mm/yyyy ***'
            });
            //console.log(productDescription);

        }
        //res.redirect("eanlist"); 

    }
    else{
        console.log('error:', error); 
        console.log('statusCode:', response && response.statusCode); 
        console.log('body:', body);
        res.render('tescodata', { title: 'response or connect fail' }); //testing the route

    }

    /******* get JSON from TESCO (COMPLETE)*******/
    router.get('/jsonData', function(req, res) { 
        console.log('body:',body);
        //storeData(eanSelected, body,req);
        res.render('jsonData', { 
            title: 'Getting JSON DATA',
            jsonBody: body
        }); //testing the route
    });

});
    //console.log(options);
    //res.render('eandetail', { title: 'eandetail'});
});



function storeData(eancode,jsonBody,req){
    //function to store data as json into eanProductData collection
    var db = req.db;
    var eanCode = eancode;
    var eanProductData = db.get('eanProductData');

    // Submit to the DB into a collection
    var collectionDocument = JSON.parse(jsonBody);
    console.log(collectionDocument);

    eanProductData.insert(collectionDocument, function (err, doc) {
        if (err) {
            // If it failed, return error
            console.log(err)
            res.send("There was a problem adding the information to the database.");
        }
        else {
            // And forward to success page
            console.log("***product store into db ***")
            //res.redirect("eanlist");
            return true;
        }
    });

}
    

/**** GET TESCO data I -- just for test--****/
router.get('/tescodata', function(req, res) {
    
     var options = {
        method: 'GET', 
        hostname: 'dev.tescolabs.com',   
        url: 'https://dev.tescolabs.com/product/?gtin=04548736003446', //05022996000135',
        //url: 'https://dev.tescolabs.com/product/?gtin='+eanSelected, //05022996000135',
        headers: {
        'Ocp-Apim-Subscription-Key': 'd00f3cbe704e4aec8aa8fb91b94d43f0'
        },
        rejectUnauthorized: false
        };

    request(options, function (error, response, body) {
    if (!error) {
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('1.-error',error);
        
        var productsTesco = JSON.parse(body);
        console.log(isEmpty());
        function isEmpty(){
            if(productsTesco.products[0]){
                console.log('info:',productsTesco.products[0]);
                return false;
            }
            else{
                return true; 
            }
        }

        res.render('tescodata', { title: 'test' });

    
    }
    else{
        console.log('2.-error:', error); 
        console.log('statusCode:', response && response.statusCode); 
        console.log('body:', body);
        res.render('tescodata', { title: 'fail :(' }); //testing the route
    }

});
});
/**** GET TESCO data  I ****/




module.exports = router;

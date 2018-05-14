const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const fs = require('fs');

const geo = require("./geolocation.js")
const news = require("./news.js")

const forecast = require("./5days.js")
const pixabay = require("./pixabay.js")
const places = require("./attract.js")

const keys = get_keys()
/**
 * Variable used to use express() module
 * @type {Objext}
 */
var app = express();

/**
 * Variable used to store search history
 * @type {Array}
 */
var history = [];

/**
 * Variable used for log text
 * @type {String}
 */
var log_text = "";
app.set('view engine', 'hbs')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/public'));


/**
 * Variable used to store /public/ directory
 * @type {[type]}
 */
var dpub = __dirname + '/public/'

app.get('/', (request, response) => {
    response.render(dpub + 'App.hbs', {
        "apikey": keys.googlemaps
    });
});
//
app.post('/', function(request, response) {
    var returning_data = {}
    console.log(request.body)
    var location = request.body["location"]
    var filter = request.body["filter"]

        geo.get_location(location, keys.geolocation).then((dictionary) => {
            returning_data["location"] = dictionary
            return places.places(returning_data.location["lat"], returning_data.location["long"], request.body["filter"], keys.googleplaces)
            .then((dictionary)=>{
                returning_data["places"] = dictionary
                return pixabay.city_background(location, keys.pixabay)
                .then((dictionary) => {
                    returning_data["background"] = dictionary
                    return news.NewsHeading(location, keys.news)
                        .then((dictionary) => {
                            returning_data["headlines"] = dictionary
                            return forecast.forecast5days(returning_data.location["location"], keys.worldweatheronline)
                                .then((dictionary)=>{
                            returning_data["weather"]=dictionary
                            returning_data["error"]="None"
                            response.send(JSON.stringify(returning_data))
                                },(error)=>{
                                    console.log(error)
                                })
                        }, (error)=>{
                            console.log(error);
                        })
                }, (error)=>{
                        console.log(error);
                })
            }, (error) => {
                response.send(JSON.stringify(error))
            })
        })
    
})



/**
 * Appends list into search.json.
 * @param {array} list - writes a list object into a json file.
 */
function write_file(list) {
    fs.writeFileSync("search.json", JSON.stringify(list));
};

/**
 * reads a Json file and returns it into a string
 */
function get_keys() {
    file = fs.readFileSync("Apikeys.json")
    return JSON.parse(file)
}

/**
 * makes the server accessable via an internet browser
 */
app.listen(8080, () => {
    console.log('server is up on port 8080');
});
var express = require('express');
var router = express.Router();

//const config = require('../config'); // ..config/index.js by default
const config = require('../config');
const fs = require('fs');


/* Dynamically load all route files in the current directory */
let routes = fs.readdirSync(__dirname);
routes.forEach(file => {
    if (file !== 'index.js' && file !== 'image.js') {
      console.log("Loaded Route File:", file); // <--- ADD THIS LINE
        const route = require(`./${file}`);
        const routePath = `/${file.replace('.js', '')}`;
        router.use(routePath, route);
    }
});


/* Dynamically load all route files in the current directory */
/*  Alternative syntax
let routes = fs.readdirSync(__dirname);
for (let route of routes) {
  if (route !== 'index.js' && route.endsWith('.js')) {
    router.use("/"+route.replace('.js',''), require(`./${route}`));
  }
}
*/



module.exports = router;

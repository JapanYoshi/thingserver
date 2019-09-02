var fs = require('fs');
var users = JSON.parse(fs.readFileSync('./api/users.json').toString());

const calc_age = (date) => {
    if (typeof(date) === typeof(new Date())) {   
        var diff_ms = Date.now() - date.getTime();
        var age_dt = new Date(diff_ms);
        return Math.abs(age_dt.getUTCFullYear() - 1970);
    } else {
        console.log(date);
        console.log(typeof(date));
        return -1;
    }
}

module.exports = function(req, res){
    console.log(req.body.username);
    if (users.hasOwnProperty(req.body.username)) {
        if (users[req.body.username].password === req.body.password) {
            data = users[req.body.username];
            data.valid = true;
            birthday_as_date = new Date(data.dob.substring(0, 4), data.dob.substring(5, 7) - 1, data.dob.substring(8, 10));
            data.age = calc_age(birthday_as_date);
            data.username = req.body.username;
            res.send(data);
        } else {
            res.send({valid: false, reason: "Password did not match"});
        }
    } else {
        res.send({valid: false, reason: "Could not find username"});
    }
};
module.exports = function(req, res){
    console.log("Require Works");
    console.log(req.body.username);
    res.send({foo: "bar"});
};
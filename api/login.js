var fs = require('fs');

// file updates
const update = (filename, content) => {
  return fs.writeFileSync(filename, JSON.stringify(content, null, 2));
  // returns number of bytes written
}
const reload = (filename) => {
  return JSON.parse(fs.readFileSync(filename).toString());
}
const userFile = "./api/users.json";
const groupFile = "./api/groups.json";
var users = reload(userFile);
var groups = reload(groupFile);
// auth stuff
const authLevels = ["any", "groupAssistant", "groupAdmin", "superAdmin"];
const perms = {
  makeSuperAdmin: authLevels.indexOf("superAdmin"),
  makeGroupAdmin: authLevels.indexOf("superAdmin"),
  makeUser: authLevels.indexOf("superAdmin"),
  stopBeingGroupAdmin: authLevels.indexOf("groupAdmin"),
  makeGroupAssistant: authLevels.indexOf("groupAdmin"),
  removeGroup: authLevels.indexOf("groupAdmin"),
  stopBeingGroupAssistant: authLevels.indexOf("groupAssistant"),
  createGroup: authLevels.indexOf("groupAssistant"),
  makeChannel: authLevels.indexOf("groupAssistant"),
  userChannel: authLevels.indexOf("groupAssistant"),
  updateSelf: authLevels.indexOf("any"),
  removeSelf: authLevels.indexOf("any")
}
const getAuthLevel = (username) => {
  if (users[username].supp) {
    return authLevels.indexOf("superAdmin");
  } else if (users[username].ofGroupAdminsRole) {
    return authLevels.indexOf("groupAdmin");
  } else if (users[username].ofGroupAssistantRole) {
    return authLevels.indexOf("groupAssistant");
  } else {
    return authLevels.indexOf("any");
  }
};
const verify = (username, password, authLevel) => {
  if (authLevel === -1 || authLevel === undefined) {
    return {valid: false, reason: "That action was not found"};
  }
  if (users.hasOwnProperty(username)) {
    if (users[username].password === password) {
      if (getAuthLevel(username) >= authLevel) {
        return {valid: true};
      } else {
        return {valid: false, reason: "This user cannot do that"};
      }
    } else {
      return {valid: false, reason: "Password did not match"};
    }
  } else {
    return {valid: false, reason: "Could not find username"};
  }
}

const listAllUsers = () => {
  var data = {valid: true, users: {}};
  for (var prop in users){
    if (users.hasOwnProperty(prop)){
      data.users[prop] = users[prop];
      birthday_as_date = new Date(data.users[prop].dob.substring(0, 4), data.users[prop].dob.substring(5, 7) - 1, data.users[prop].dob.substring(8, 10));
      data.users[prop].age = calc_age(birthday_as_date);
    }
  }
  return data;
}

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

module.exports = {
  login: function(req, res){
    console.log(`login ${req.body.username} ${req.body.password}`);
    var auth = verify(req.body.username, req.body.password, authLevels.indexOf("any"));
    if (auth.valid) {
      data = users[req.body.username];
      data.valid = true;
      birthday_as_date = new Date(data.dob.substring(0, 4), data.dob.substring(5, 7) - 1, data.dob.substring(8, 10));
      data.age = calc_age(birthday_as_date);
      data.username = req.body.username;
      res.send(data);
    } else {
      res.send(auth);
    }
    return;
  },
  list: function(req, res){
    console.log(`list ${req.body.username} ${req.body.password}`);
    var auth = verify(req.body.username, req.body.password, authLevels.indexOf("superAdmin"));
    if (auth.valid) {
      data = listAllUsers();
      res.send(data);
      return;
    } else {
      res.send(auth);
      return;
    }
  },
  update: function(req, res){
    var auth = verify(req.body.username, req.body.password, perms[req.body.editType]);
    if (auth.valid) {
      // update applicable file
      var usersEdited = false;
      var groupsEdited = false;
      console.log(req.body.content);
      var content = JSON.parse(req.body.content); 
      // For user updates, make it 1 level deep and start with "username"
      // For group updates, separate directory name with slashes
      switch (req.body.editType) {
        case "makeSuperAdmin":
          users[req.body.content.username].supp = content.value;
          usersEdited = true;
          break
        case "makeGroupAdmin":
          users[content.username].ofGroupAdminsRole = content.value;
          users[content.username].ofGroupAssistantRole = users[content.username].ofGroupAssistantRole || content.value;
          usersEdited = true;
          break
        case "makeUser":
          if (
            content.hasOwnProperty("username") &&
            content.hasOwnProperty("password") &&
            content.hasOwnProperty("password") && 
            content.hasOwnProperty("password")
          ) {
            users[content.username] = {
              password: content.password,
              dob: content.dob,
              email: content.email,
              supp: false,
              ofGroupAdminsRole: false,
              ofGroupAssistantRole: false
            };
            usersEdited = true;
          } else {
            res.send({"valid": false, "reason": "Missing data (Make sure it has password, dob, and email)"});
            return;
          }
          break
        case "stopBeingGroupAdmin":
          users[req.body.username].ofGroupAdminRole = false;
          usersEdited = true;
          break
        case "makeGroupAssistant":
          users[content.username].ofGroupAssistantRole = content.value;
          usersEdited = true;
          break
        case "removeGroup":
          delete groups[content.path];
          groupsEdited = true;
          break
        case "stopBeingGroupAssistant":
          users[req.body.username].ofGroupAssistantRole = false;
          usersEdited = true;
          break
        case "createGroup":
          if (
            content.hasOwnProperty("path")
          ) {
            groups[content.path] = {
              group: true,
              channels: {},
              groupAdmins: [],
              groupAssistants: getAuthLevel(req.body.username) === authLevels.indexOf("supp") ? [] : [req.body.username],
              users: []
            };
            groupsEdited = true;
          } else {
            res.send({"valid": false, "reason": "Missing data (Make sure it has path)"});
            return;
          }
          break
        case "makeChannel":
          if (
            content.hasOwnProperty("path")
          ) {
            if (content.hasOwnProperty("group")) {
              if (content.value) {
                groups[content.group].channels[content.path] = {
                  group: false,
                  users: []
                };
              } else {
                delete groups[content.group].channels[content.path];
              }
            } else {
              if (content.value) {
                groups[content.path] = {
                  group: false,
                  users: []
                };
              } else {
                delete groups[content.path];
              }
            }
            res.send({"valid": true});
            groupsEdited = true;
          } else {
            res.send({"valid": false, "reason": "Missing data (Make sure it has path)"});
            return;
          }
          break
        case "userChannel":
          if (groups.hasOwnProperty(content.path)) {
            if (groups[content.path].users.indexOf(content.username) !== -1) {
              // user in channel
              if (content.value) {
                res.send({"valid": false, "reason": "User already in channel"});
                return;
              } else {
                groups[content.path].users.splice(
                  groups[content.path].users.indexOf(content.username)
                  , 1
                );
                groupsEdited = true;
              }
            } else {
              // user not in channel
              if (content.value) {
                groups[content.path].users.push(content.username);
                groupsEdited = true;
                res.send({"valid": true});
              } else {
                res.send({"valid": false, "reason": "User not in channel"});
                return;
              }
            }
          } else {
            res.send({"valid": false, "reason": "Unrecognized path"});
            return;
          }
          break
        case "updateSelf":
          for (var prop in content){
            console.log(`prop ${prop} content ${content[prop]}`);
            if (users[req.body.username].hasOwnProperty(prop)){
              users[req.body.username][prop] = content[prop];
            }
          }
          usersEdited = true;
          break
        case "removeSelf":
          delete users[req.body.username];
          usersEdited = true;
          break
        default:
          res.send({"valid": false, "reason": "Unrecognized action"});
          return;
      }
      // save and reload
      if (groupsEdited) {
        update(groupFile, groups);
        groups = reload(groupFile);
      }
      if (usersEdited) {
        update(userFile, users);
        users = reload(userFile);
      }
      res.send({"valid": true});
    } else {
      res.send(auth);
    }
  },
  groups: function(req, res) {
    console.log(`groups ${req.body.username} ${req.body.password}`);
    var auth = verify(req.body.username, req.body.password, authLevels.indexOf("any"));
    if (auth.valid) {
      clearance = getAuthLevel(req.body.username);
      if (clearance >= authLevels.indexOf("superAdmin")){
        // get entire thing
        res.send(groups);
      } else {
        // get channels where you are groupadmin, groupassistant, or user
        data = {};
        for (prop in groups) {
          if (groups.hasOwnProperty(prop)){
            if (groups[prop].group) {
              if (groups[prop].groupAdmins.indexOf(req.body.username) !== -1
               || groups[prop].groupAssistants.indexOf(req.body.username) !== -1
               || groups[prop].users.indexOf(req.body.username) !== -1
              ) {
                // you are in this group
                data[prop] = groups[prop];
              } else {
                for (channel in groups[prop].channels) {
                  if (groups[prop].channels.hasOwnProperty(channel)) {
                    if (groups[prop].channels[channel].users.indexOf(req.body.username) !== -1) {
                      // you are in a subchannel
                      data[prop] = groups[prop];
                      break;
                    }
                  }
                }
              }
            } else {
              if (groups[prop].users.indexOf(req.body.username) !== -1) {
                // you are in this group
                data[prop] = groups[prop];
              }
            }
          }
        }
        res.send(data);
      }
    } else {
      res.send(auth);
    }
    return;
  }
}
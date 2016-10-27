var storageArea = chrome.storage.sync;
var userList = [{name: "Andre", auth: "big squish"}, {name: "Caleb", auth: "big thirstay"}];
var env;

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
  var activeTabUrl = arrayOfTabs[0].url;

  if (activeTabUrl.includes('dev-godaddy')) {
    env = 'Dev';
  } else if (activeTabUrl.includes('test-godaddy')) {
    env = 'Test';
  } else if (activeTabUrl.includes('ote-godaddy')) {
    env = 'Ote';
  } else if (activeTabUrl.includes('godaddy.com')) {
    env = 'Prod';
  } else {
    env = null;
    $('#addAcc').prop('disabled', true);
    $('#logout').prop('disabled', true);
  }

  $(document).ready(function(){
    var usersenv = "users" + env;
    storageArea.get("users" + env, function(obj) {
      var users = obj[usersenv];

      if (!(users instanceof Array)) {
        users = [];
      }

      var toSet = {};
      toSet[usersenv] = users;

      storageArea.set(toSet);

      userList = users;

      userList.forEach(function(n) {
        $('tbody').append('<tr><td class = "name" id=' + n.name + '>' + n.name
          + '</td><td class = "options"><span class="update" id=' + n.name + '><a>Update</a></span><a><span class="glyphicon glyphicon-trash" id=' + n.name
          + '></span></a></td></tr>');
      });

      if (userList.length == 0) {
        $('section').append('<div class="text-muted center">You have no accounts. Log in to your GoDaddy Account and click "Add Current User" to add an account."</div>')
      }
    });

    chrome.cookies.get({url: activeTabUrl, name: "auth_idp"}, function(cookie) {
      name = jwt_decode(cookie.value).username;
      $('td#' + name).closest('tr').addClass('active');

      var toSet = {};
      toSet["curUser"] = name
      storageArea.set(toSet)
    });

    $('#addAcc').click(function() {addAccount();});
    $('#logout').click(function() {logOut();})
  });
});

$(document).on("click", "#names tr td.name", function(e) {
  n = e.toElement;
  var name = n.id;
  var user = null;

  $('td').closest('tr').removeClass('active');
  $('td#'+name).closest('tr').addClass('active');

  userList.forEach(function(n) {
    if (n.name === name) {
      user = n;
    }
  });

  if (user != null) {
    loginAs(user);
  }
});

$(document).on("click", "#names tr td span.glyphicon-trash", function(e) {
  n = e.toElement;
  var name = n.id;
  var user = null;

  userList.forEach(function(n) {
    if (n.name === name) {
      user = n;
    }
  })

  userList.splice(userList.indexOf(n), 1);

  var toSet = {};
  toSet["users" + env] = {"users": userList};

  storageArea.set(toSet);

  location.reload();
})

$(document).on("click", "#names tr td span.update", function(e) {
  n = e.toElement;
  var name = n.id;
  var user = null;

  userList.forEach(function(n) {
    if (n.name === name) {
      user = n;
    }
  })

  if (user != null) {
    loginAs(user);
  }

  addAccount();
})

function loginAs(user) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    c = user.auth;
    chrome.cookies.set({
      url: tabs[0].url,
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      secure: c.secure,
      httpOnly: c.httpOnly,
      storeId: c.storeId
    }, function() {
      var toSet = {};
      toSet["curUser"] = user.name;
      storageArea.set(toSet);

      chrome.tabs.reload();
    });
  });
}

function addAccount() {
  chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
    var activeTab = arrayOfTabs[0];
    var activeTabUrl = activeTab.url;

    chrome.cookies.get({url: activeTabUrl, name: "auth_idp"}, function(cookie) {
      var auth = jwt_decode(cookie.value)

      var exists = false;

      userList.forEach(function(user) {
        if (user.name === auth.username) {
          exists = true;

          user.auth = cookie;

          var toSet = {};
          toSet["users" + env] = userList;

          storageArea.set(toSet);
        }
      });

      if (exists == true) {
        $('.alert-warning').addClass('shown');
        return;
      }

      userList.push({name: auth.username, auth: cookie});

      var toSet = {};
      toSet["users" + env] = userList;

      storageArea.set(toSet);

      location.reload();
    });
  });
}

function logOut() {
  chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
    var activeTab = arrayOfTabs[0];
    var activeTabUrl = activeTab.url;

    chrome.cookies.remove({url: activeTabUrl, name: "auth_idp"});

    $('td').closest('tr').removeClass('active');

    chrome.tabs.reload();
  });
}
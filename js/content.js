var login = document.getElementById("username");
if (login) {
  chrome.storage.sync.get("curUser", function(user) {
    login.value = user.curUser;
    document.getElementById("password").focus();
    document.getElementById("password").select();
  })
}
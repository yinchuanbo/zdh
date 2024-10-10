const Login = document.querySelector("#Login");
const Register = document.querySelector("#Register");
const username = document.querySelector(".username");
const password = document.querySelector(".password");
const usernameR = document.querySelector(".username_r");
const passwordR = document.querySelector(".password_r");
const registerMethod = document.querySelector(".register_method");
const loginMethod = document.querySelector(".login_method");
const wrappper = document.querySelector(".wrappper");

Login.onclick = () => {
  const usernameVal = username.value;
  const passwordVal = password.value;
  if (!usernameVal.trim() || !passwordVal.trim()) {
    new LightTip().error("请输入同户名或密码");
    return;
  }
  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: usernameVal.trim(),
      password: passwordVal.trim(),
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      if (res?.code === 200) {
        localStorage.setItem('usr', usernameVal.trim())
        localStorage.setItem('pwd', passwordVal.trim())
        new LightTip().success("登录成功");
        location.href = "/";
      } else {
        new LightTip().error("登录失败，请切换账号");
      }
    });
};

registerMethod.onclick = () => {
  wrappper.classList.remove("isLogin", "isR");
  wrappper.classList.add("isR");
};

loginMethod.onclick = () => {
  wrappper.classList.remove("isLogin", "isR");
  wrappper.classList.add("isLogin");
};

Register.onclick = () => {
  const usernameVal = usernameR.value;
  const passwordVal = passwordR.value;
  if (!usernameVal.trim() || !passwordVal.trim()) {
    new LightTip().error("请输入同户名或密码");
    return;
  }
  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: usernameVal.trim(),
      password: passwordVal.trim(),
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      if (res?.code === 200) {
        new LightTip().success("注册成功");
        loginMethod.click();
      } else {
        new LightTip().error(res?.message || "注册失败");
      }
    });
};

window.onload = function () {
  const usernameInput = document.querySelector('.ui-input.username');
  usernameInput.value = localStorage.getItem('usr') || '';
  const pwdInput = document.querySelector('.ui-input.password');
  pwdInput.value = localStorage.getItem('pwd') || '';
};
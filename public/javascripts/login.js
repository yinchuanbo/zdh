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
      console.log('登录响应:', res);
      if (res?.code === 200) {
        localStorage.setItem('usr', usernameVal.trim())
        localStorage.setItem('pwd', passwordVal.trim())
        new LightTip().success("登录成功");
        console.log('准备跳转到首页');
        
        // 通知父窗口登录成功
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'login_success',
            message: '登录成功'
          }, '*');
        }
        
        // 使用setTimeout确保提示显示后再跳转
        setTimeout(() => {
          // 如果在iframe中，让父窗口处理导航
          if (window.parent && window.parent !== window) {
            // 在iframe中，不自动跳转，让父窗口处理
            console.log('在iframe中，等待父窗口处理导航');
          } else {
            // 在普通窗口中，正常跳转
            window.location.href = "/";
          }
        }, 1000);
      } else {
        console.log('登录失败:', res);
        new LightTip().error("登录失败，请切换账号");
      }
    })
    .catch((error) => {
      console.error('登录请求错误:', error);
      new LightTip().error("网络错误，请重试");
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
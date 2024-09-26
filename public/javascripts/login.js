const Login = document.querySelector("#Login");
const username = document.querySelector(".username");
const password = document.querySelector(".password");

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
        new LightTip().success("登录成功");
        location.href = "/";
      } else {
        new LightTip().error("登录失败，请切换账号");
      }
    });
};

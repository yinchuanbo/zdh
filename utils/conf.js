const { getRequireDynamicFile } = require("./setData")

let localPaths = {},
  LocalListTest = {},
  LocalListPro = {},
  testFoldList = {},
  proFoldList = {},
  deployInfo = {
    username: "lixiaohui@qq.com",
    password: "123456",
    languages: {},
  },
  testConn = {
    host: "3.237.60.56",
    port: 22,
    username: "ftpuser",
    password: "zhm8JMWwPQDLc0aG",
  },
  proConn = {
    host: "manage.vidnoz.com",
    port: 22,
    username: "ftpuser",
    password: "kIEmTPdyhIdnjJ2s",
  },
  preview = "\\preview\\",
  templates = "\\templates\\new-template\\";

const getConf = (uname = "", resObj = {}) => {
  const userInfo = getRequireDynamicFile("user-info.js", {});
  let pathname, domain, lans, ports;
  if (!userInfo?.[uname]) {
    resObj.redirect("/settings");
    return;
  } else if (userInfo[uname]) {
    pathname = userInfo[uname]["pathname"];
    domain = userInfo[uname]["domain"];
    lans = userInfo[uname]["lans"];
    ports = userInfo[uname]["ports"];
  }
  for (const key in lans) {
    const element = lans[key];
    localPaths[key] = `${pathname}\\${element}`;
    LocalListTest[key] = `${pathname}\\${element}${preview}`;
    LocalListPro[key] = `${pathname}\\${element}${templates}`;
    testFoldList[key] = `/html/${key}-test.vidnoz.com/`;
    deployInfo.languages[key] =
      `http://manage${key === "en" ? "" : "-" + key}.vidnoz.com/frontend/login`;
    if (key === "en") {
      proFoldList[key] = `/html/manage.vidnoz.com/templates/new-template/`;
    } else {
      proFoldList[key] =
        `/html/manage-${key}.vidnoz.com/templates/new-template/`;
    }
  }
  const params = {
    pathname,
    domain,
    lans,
    ports,
    localPaths,
    LocalListTest,
    LocalListPro,
    testFoldList,
    proFoldList,
    testConn,
    proConn,
    deployInfo,
  };
  return params;
};

module.exports = getConf;

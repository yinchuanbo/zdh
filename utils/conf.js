const userInfo = require("./user-info");

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

const getConf = (uname = "") => {
  if (!userInfo[uname] && uname !== "admin") {
    console.log("没有配置");
    return;
  }
  let pathname = `D:\\PROJECT`;
  let lans = {
    en: "pc.makevideoclip.com",
    jp: "jp.makevideoclip.com",
    it: "it.makevideoclip.com",
    fr: "fr.makevideoclip.com",
    de: "de.makevideoclip.com",
    ar: "ar.makevideoclip.com",
    pt: "pt.makevideoclip.com",
    es: "es.makevideoclip.com",
    kr: "kr.makevideoclip.com",
    nl: "nl.makevideoclip.com",
    tr: "tr.makevideoclip.com",
    tw: "tw.makevideoclip.com",
  };
  let ports = {
    en: "9292",
    jp: "9090",
    it: "8888",
    fr: "8989",
    de: "8585",
    ar: "9191",
    pt: "8787",
    es: "8686",
    kr: "9696",
    nl: "9797",
    tr: "9898",
    tw: "9999",
  };
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
    domain: "yinchuanbo.vidnoz.com",
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

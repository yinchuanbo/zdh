const { settingsInsert, findSettingsByUserId, settingsUpdate } = require("../utils/supabase")
async function setSettings({ data, req }) {
  const findId = await findSettingsByUserId(req.user.id)
  if (!findId) {
    await settingsInsert({
      content: JSON.stringify(data, null, 2),
      userid: req.user.id
    });
  } else {
    await settingsUpdate({
      newContent: JSON.stringify(data, null, 2),
      userid: req.user.id
    })
  }


  return Promise.resolve()
}

module.exports = setSettings;

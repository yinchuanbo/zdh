var express = require("express");
const { authenticateToken } = require("../permissions");
const { getCommitFileChanges, getFileContentsForCommit, setFile } = require("../utils/code-restoration")
var router = express.Router();

router.get("/", authenticateToken, function (req, res, next) {
  res.render("code-restoration");
});

router.post("/get-code-restoration", authenticateToken, async function (req, res, next) {
  const { pathVal, commitVal } = req.body;
  let result = [];
  try {
    const ress = await getCommitFileChanges({
      pathVal,
      commitHash: commitVal
    })
    result = ress;
    if (result?.length) {
      res.json({
        code: 200,
        data: result,
        message: "code-restoration-success",
      });
    } else {
      res.json({
        code: 200,
        data: [],
        message: "该 commit 无修改",
      });
    }
  } catch (error) {
    res.json({
      code: 200,
      data: [],
      message: error?.message || error,
    });
  }
});

router.post("/get-code-content", authenticateToken, async function (req, res, next) {
  const { pathVal, commitVal, fileP } = req.body;
  try {
    const ress = await getFileContentsForCommit({
      commitHash: commitVal,
      pathVal,
      filename: fileP
    })
    res.json({
      code: 200,
      data: ress,
      message: "code-content-success",
    });
  } catch (error) {
    res.json({
      code: 200,
      data: [],
      message: error?.message || error,
    });
  }
});
router.post("/save-code", authenticateToken, async function (req, res, next) {
  if (!res.app.locals.isW) {
    res.json({
      code: 200,
      message: "请先开启 Watching",
    });
    return;
  }
  const { pathVal, filename, content } = req.body;
  try {
    await setFile({
      pathVal,
      filename,
      content
    })
    res.json({
      code: 200,
      message: "code-save-success",
    });
  } catch (error) {
    res.json({
      code: 200,
      data: [],
      message: error?.message || error,
    });
  }
});

module.exports = router;

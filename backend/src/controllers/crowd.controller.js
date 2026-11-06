const crowdService = require("../services/crowd.service");

const getAll = async (req, res, next) => {
  try {
    const data = await crowdService.getCrowdForAll();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const data = await crowdService.getCrowdForOne(req.params.waterPointId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getOne,
};

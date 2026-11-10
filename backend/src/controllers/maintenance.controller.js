const maintenanceService = require("../services/maintenance.service");

const getMaintenanceRequests = async (req, res, next) => {
  try {
    const data = await maintenanceService.getMaintenanceRequests(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMaintenanceRequestById = async (req, res, next) => {
  try {
    const data = await maintenanceService.getMaintenanceRequestById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const acknowledge = async (req, res, next) => {
  try {
    const data = await maintenanceService.acknowledge(req.params.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const assign = async (req, res, next) => {
  try {
    const { staffId } = req.body || {};
    const data = await maintenanceService.assign(req.params.id, staffId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const data = await maintenanceService.updateStatus(req.params.id, status, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res, next) => {
  try {
    const data = await maintenanceService.verify(req.params.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const complete = async (req, res, next) => {
  try {
    const data = await maintenanceService.complete(req.params.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenanceRequests,
  getMaintenanceRequestById,
  acknowledge,
  assign,
  updateStatus,
  verify,
  complete,
};


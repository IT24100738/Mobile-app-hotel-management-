const Experience = require('../models/Experience');

exports.getExperiences = async (req, res, next) => {
  try {
    const experiences = await Experience.find();
    res.status(200).json({ success: true, count: experiences.length, data: experiences });
  } catch (error) {
    next(error);
  }
};

exports.getExperience = async (req, res, next) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      res.status(404);
      throw new Error(`Experience not found with id of ${req.params.id}`);
    }
    res.status(200).json({ success: true, data: experience });
  } catch (error) {
    next(error);
  }
};

exports.createExperience = async (req, res, next) => {
  try {
    const experience = await Experience.create(req.body);
    res.status(201).json({ success: true, data: experience });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updateExperience = async (req, res, next) => {
  try {
    let experience = await Experience.findById(req.params.id);
    if (!experience) {
      res.status(404);
      throw new Error(`Experience not found with id of ${req.params.id}`);
    }
    experience = await Experience.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: experience });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.deleteExperience = async (req, res, next) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      res.status(404);
      throw new Error(`Experience not found with id of ${req.params.id}`);
    }
    await experience.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

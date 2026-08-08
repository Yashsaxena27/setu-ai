import { Response } from "express";
import Reminder from "../models/Reminder";
import { AuthRequest } from "../middleware/authMiddleware";

export const getReminders = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const reminders = await Reminder.find({
      user_id: req.userId,
    });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reminders" });
  }
};

export const createReminder = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const reminder = await Reminder.create({
      ...req.body,
      user_id: req.userId,
    });
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Failed to create reminder" });
  }
};

export const updateReminder = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      {
        _id: req.params.id,
        user_id: req.userId,
      },
      req.body,
      { new: true }
    );
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Failed to update reminder" });
  }
};

export const deleteReminder = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    await Reminder.findOneAndDelete({
      _id: req.params.id,
      user_id: req.userId,
    });
    res.json({ message: "Reminder deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete reminder" });
  }
};
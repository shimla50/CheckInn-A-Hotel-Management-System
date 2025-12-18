/**
 * @fileoverview Service controller for service management operations
 * @module controllers/serviceController
 */

import Service from '../models/Service.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';

/**
 * Create a new service
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const createService = async (req, res, next) => {
  try {
    const { name, description, price, isActive } = req.body;

    // Validation
    if (!name || price === undefined) {
      return res.status(400).json(
        errorResponse('Please provide name and price', null, 400)
      );
    }

    // Create service
    const service = await Service.create({
      name,
      description,
      price,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(
      successResponse('Service created successfully', { service }, 201)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update a service
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, isActive } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json(
        errorResponse('Service not found', null, 404)
      );
    }

    // Update fields
    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.status(200).json(
      successResponse('Service updated successfully', { service }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a service
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json(
        errorResponse('Service not found', null, 404)
      );
    }

    await Service.findByIdAndDelete(id);

    res.status(200).json(
      successResponse('Service deleted successfully', null, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * List services
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const listServices = async (req, res, next) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const services = await Service.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Service.countDocuments(filter);

    res.status(200).json(
      successResponse('Services retrieved successfully', {
        services,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};


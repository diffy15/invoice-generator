const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: categories.map(cat => cat.name)
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    // Create new category
    const category = await Category.create({ name: name.trim() });

    res.json({
      success: true,
      message: 'Category created successfully',
      data: category.name
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

/**
 * @route   PUT /api/categories/:oldName
 * @desc    Update category name (updates all products with this category)
 * @access  Public
 */
router.put('/:oldName', async (req, res) => {
  try {
    const { oldName } = req.params;
    const { newName } = req.body;

    if (!newName || !newName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New category name is required'
      });
    }

    // Update category in Category collection
    const category = await Category.findOneAndUpdate(
      { name: oldName },
      { name: newName.trim() },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Update all products with old category to new category
    const result = await Product.updateMany(
      { category: oldName },
      { $set: { category: newName.trim() } }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} product(s)`,
      data: {
        oldName,
        newName: newName.trim(),
        productsUpdated: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

/**
 * @route   DELETE /api/categories/:name
 * @desc    Delete a category (only if no products use it)
 * @access  Public
 */
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;

    // Check if any products use this category
    const productCount = await Product.countDocuments({ category: name });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productCount} product(s) are using it.`
      });
    }

    // Delete category
    await Category.deleteOne({ name });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

module.exports = router;
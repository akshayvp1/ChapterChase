
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const path = require('path');
const fs = require('fs');
const User = require("../../models/userModel");
const { promisify } = require('util');
const Order = require('../../models/orderModel');



// Load all orders
const loadOrderDetails = async (req, res) => {
  try {
    const admin = req.session.user;
    const user = req.session.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt'; 
    const sortOrder = parseInt(req.query.sortOrder) || -1; 

    const query = { user };

    if (search) {
      query.$or = [
        { 'items.product.name': { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } } 
      ];
    }

    const orders = await Order.find(query)
      .populate('items.product')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }); 

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    res.render('order-list', { admin, orders, currentPage: page, totalPages, limit, search, sortBy, sortOrder });
  } catch (error) {
    console.error('Error loading order details:', error);
    res.status(500).send('Internal Server Error');
  }
};




//get oder details
const getOrderDetails = async (req, res) => {
    try {
      const order = await Order.findById(req.params.id).populate('items.product');
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching order details', error });
    }
  };
  
  
  //update order status
  const updateOrderStatus = async (req, res) => {
    try {
        const { status, itemId } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const item = order.items.id(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Order item not found' });
        }

        if (['Cancelled', 'Returned', 'Return Requested'].includes(item.order_status)) {
            return res.status(400).json({ message: 'This order status cannot be changed.' });
        }

        if (item.order_status === 'Delivered' && status !== 'Delivered') {
            return res.status(400).json({ message: 'Delivered orders cannot be changed to a different status.' });
        }

        if (item.order_status === 'Processing' && status === 'Pending') {
            return res.status(400).json({ message: 'Processing orders cannot be changed back to Pending.' });
        }

        item.order_status = status;

        if (status === 'Delivered' && order.paymentMethod === 'Cash on Delivery') {
            order.payment_status = 'Completed';
        }

        await order.save();

        res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status', error });
    }
};

  
  

  module.exports = {
    getOrderDetails,
    updateOrderStatus,
    loadOrderDetails,
   

  }
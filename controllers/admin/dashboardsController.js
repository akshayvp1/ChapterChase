const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const randomString = require("randomstring");
const config = require("../../config/config");
const Order = require('../../models/orderModel');
const Category = require('../../models/categoryModel');





//dashboard
const loadDashboard = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;
        
        let matchCondition = {};

        if (filter === 'daily') {
            let todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            let todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            matchCondition.createdAt = {
                $gte: todayStart,
                $lt: todayEnd
            };
        } else if (filter === 'weekly') {
            let now = new Date();
            let firstDayOfWeek = now.getDate() - now.getDay(); 
            let lastDayOfWeek = firstDayOfWeek + 6; 
            let startOfWeek = new Date(now.setDate(firstDayOfWeek));
            let endOfWeek = new Date(now.setDate(lastDayOfWeek));
            startOfWeek.setHours(0, 0, 0, 0);
            endOfWeek.setHours(23, 59, 59, 999);
            matchCondition.createdAt = {
                $gte: startOfWeek,
                $lt: endOfWeek
            };
        } else if (filter === 'monthly') {
            let now = new Date();
            let firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            let lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            firstDayOfMonth.setHours(0, 0, 0, 0);
            lastDayOfMonth.setHours(23, 59, 59, 999);
            matchCondition.createdAt = {
                $gte: firstDayOfMonth,
                $lt: lastDayOfMonth
            };
        } else if (filter === 'custom' && startDate && endDate) {
            let start = new Date(startDate);
            let end = new Date(endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            matchCondition.createdAt = {
                $gte: start,
                $lte: end
            };
        }

        
        const orders = await Order.find(matchCondition)
            .populate({
                path: 'items.product',
                select: 'productName category'
            })
            .exec();

        let totalOrders = orders.length;
        let totalDiscount = 0;
        let totalSalesAmount = 0;
        let statusCounts = {
            Delivered: 0,
            Cancelled: 0,
            Returned: 0
        };

        let productSales = {}; 
        let categorySales = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                totalDiscount += item.couponDiscountAmt;
                totalSalesAmount += item.price;
                
                if (item.order_status === 'Delivered') statusCounts.Delivered++;
                if (item.order_status === 'Cancelled') statusCounts.Cancelled++;
                if (item.order_status === 'Returned') statusCounts.Returned++;

                if (item.product) {
                    if (!productSales[item.product._id]) {
                        productSales[item.product._id] = {
                            name: item.product.productName,
                            quantity: 0
                        };
                    }
                    productSales[item.product._id].quantity += item.quantity;

                    if (!categorySales[item.product.category]) {
                        categorySales[item.product.category] = {
                            name: '', 
                            quantity: 0
                        };
                    }
                    categorySales[item.product.category].quantity += item.quantity;
                }
            });
        });

        
        const categories = await Category.find().exec();
        const categoryMap = categories.reduce((map, category) => {
            map[category._id] = category.title;
            return map;
        }, {});

       
        for (let catId in categorySales) {
            if (categoryMap[catId]) {
                categorySales[catId].name = categoryMap[catId];
            }
        }

        let topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        let topCategories = Object.values(categorySales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        
        let groupBy;
        let sortBy;
        let dateFormat;

        if (filter === 'weekly') {
            groupBy = { $week: '$createdAt' };
            sortBy = { '_id.week': 1 };
            dateFormat = (weekNum) => `Week ${weekNum}`;
        } else if (filter === 'monthly') {
            groupBy = { 
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            };
            sortBy = { '_id.year': 1, '_id.month': 1 };
            dateFormat = (date) => `${date.year}-${date.month}`;
        } else if (filter === 'yearly') {
            groupBy = { $year: '$createdAt' };
            sortBy = { '_id.year': 1 };
            dateFormat = (year) => year.toString();
        } else {
            groupBy = { 
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            };
            sortBy = { '_id.year': 1, '_id.month': 1, '_id.day': 1 };
            dateFormat = (date) => `${date.year}-${date.month}-${date.day}`;
        }

        const salesData = await Order.aggregate([
            { $match: { ...matchCondition, 'items.order_status': 'Delivered' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: groupBy,
                    totalSales: { $sum: '$items.price' }
                }
            },
            { $sort: sortBy }
        ]);

        let labels = [];
        let sales = [];

        salesData.forEach(item => {
            labels.push(dateFormat(item._id));
            sales.push(item.totalSales);
        });

        let admin = req.session.user;
        if (admin) {
            res.render('dashboard', { 
                admin, 
                orders, 
                totalOrders, 
                totalDiscount, 
                totalSalesAmount,
                filter, 
                startDate, 
                endDate,
                statusCounts: JSON.stringify(statusCounts),
                chartData: JSON.stringify({ labels, sales }),
                topProducts,
                topCategories
            });
        } else {
            res.status(401).send('Unauthorized');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



module.exports = {
    loadDashboard,
}
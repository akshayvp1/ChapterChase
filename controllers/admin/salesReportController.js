const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Order = require('../../models/orderModel');



// Generate report
const generateReport = async (req, res) => {
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

    try {
        const orders = await Order.find(matchCondition)
            .populate({
                path: 'items.product',
                select: 'productName'
            })
            .exec();

        if (req.query.type === 'pdf') {
            generatePDF(orders, res);
        } else if (req.query.type === 'excel') {
            generateExcel(orders, res);
        } else {
            res.status(400).send('Invalid file type');
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

//generate pdf
const generatePDF = (orders, res) => {
    const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    res.setHeader('Content-disposition', 'attachment; filename=sales-report.pdf');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    const logoPath = 'assets/images/demos/demo-20/ChapterChase.png'; 
    doc.image(logoPath, {
        fit: [150, 150], 
        align: 'center',
        valign: 'top'
    });

    doc.fontSize(24).font('Helvetica-Bold').text('ChapterChase', { 
        align: 'center', 
        underline: true 
    });

    doc.moveDown(1); 

    doc.fontSize(16).font('Helvetica-Bold').text('Sales Report', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    const columnWidths = {
        orderId: 90,
        date: 90,
        product: 160,
        quantity: 55,
        price: 70,
        total: 70,
        discount: 60
    };

    const tableWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
    const startX = (doc.page.width - tableWidth) / 2;
    let startY = doc.y;

    doc.fontSize(10).font('Helvetica-Bold');
    const headers = ['Order #', 'Date', 'Product', 'Quantity', '₹Price', 'Total', 'Discount'];
    let x = startX;

    headers.forEach((header, index) => {
        doc.fillColor('#FFFFFF').rect(x, startY, columnWidths[Object.keys(columnWidths)[index]], 30).fill();
        doc.fillColor('#000000').text(header, x + 5, startY + 10, { 
            width: columnWidths[Object.keys(columnWidths)[index]] - 10,
            align: index > 2 ? 'right' : 'left'
        });
        x += columnWidths[Object.keys(columnWidths)[index]];
    });

    startY += 30;

    doc.fontSize(9).font('Helvetica');
    let rowCount = 0;
    let totalSalesAmount = 0;
    let totalDiscount = 0;

    orders.forEach(order => {
        order.items.forEach(item => {
            if (startY + 25 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                startY = doc.margins.top;
                x = startX;
                doc.fontSize(10).font('Helvetica-Bold');
                headers.forEach((header, index) => {
                    doc.fillColor('#FFFFFF').rect(x, startY, columnWidths[Object.keys(columnWidths)[index]], 30).fill();
                    doc.fillColor('#000000').text(header, x + 5, startY + 10, { 
                        width: columnWidths[Object.keys(columnWidths)[index]] - 10,
                        align: index > 2 ? 'right' : 'left'
                    });
                    x += columnWidths[Object.keys(columnWidths)[index]];
                });
                startY += 30;
            }

            x = startX;
            const rowHeight = 25;

            if (rowCount % 2 === 0) {
                doc.fillColor('#F0F0F0').rect(x, startY, tableWidth, rowHeight).fill();
            }

            doc.fillColor('#000000');
            doc.text(`#${order.orderId}`, x + 5, startY + 7, { width: columnWidths.orderId - 13 });
            x += columnWidths.orderId;

            doc.text(order.createdAt.toDateString(), x + 5, startY + 7, { width: columnWidths.date - 13 });
            x += columnWidths.date;

            doc.text(item.product.productName, x + 5, startY + 7, { width: columnWidths.product - 13 });
            x += columnWidths.product;

            doc.text(item.quantity.toString(), x + 5, startY + 7, { width: columnWidths.quantity - 13, align: 'right' });
            x += columnWidths.quantity;

            const itemPrice = (item.price / item.quantity).toFixed(2);
            doc.text(itemPrice, x + 5, startY + 7, { width: columnWidths.price - 13, align: 'right' });
            x += columnWidths.price;

            const itemTotal = item.price.toFixed(2);
            doc.text(itemTotal, x + 5, startY + 7, { width: columnWidths.total - 13, align: 'right' });
            x += columnWidths.total;

            const discount = item.couponDiscountAmt.toFixed(2);
            doc.text(discount, x + 5, startY + 7, { width: columnWidths.discount - 13, align: 'right' });

            totalSalesAmount += parseFloat(itemTotal);
            totalDiscount += parseFloat(discount);

            startY += rowHeight;
            rowCount++;
        });
    });

    // Add totals row
    if (startY + 35 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        startY = doc.margins.top;
    }
    if (startY + 60 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        startY = doc.margins.top;
    }

    x = startX;
    const totalsRowHeight = 30;
    const totalsWidth = tableWidth * 0.4; // 40% of table width for totals section
    const totalsX = startX + tableWidth - totalsWidth;

    // Draw totals box
    doc.rect(totalsX, startY, totalsWidth, totalsRowHeight * 2).fill('#F0F0F0');
    doc.fillColor('#000000');

    // Total Sales row
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Total Sales:', totalsX + 10, startY + 10, { width: totalsWidth / 2 - 10, align: 'left' });
    doc.text(`${totalSalesAmount.toFixed(2)}`, totalsX + totalsWidth / 2, startY + 10, { width: totalsWidth / 2 - 10, align: 'right' });

    // Total Discount row
    doc.text('Total Discount:', totalsX + 10, startY + totalsRowHeight + 10, { width: totalsWidth / 2 - 10, align: 'left' });
    doc.text(`${totalDiscount.toFixed(2)}`, totalsX + totalsWidth / 2, startY + totalsRowHeight + 10, { width: totalsWidth / 2 - 10, align: 'right' });

    // Draw borders
    doc.rect(totalsX, startY, totalsWidth, totalsRowHeight * 2).stroke();
    doc.moveTo(totalsX, startY + totalsRowHeight).lineTo(totalsX + totalsWidth, startY + totalsRowHeight).stroke();
    doc.moveTo(totalsX + totalsWidth / 2, startY).lineTo(totalsX + totalsWidth / 2, startY + totalsRowHeight * 2).stroke();

    doc.end();
};





// Generate Excel
const generateExcel = async (orders, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
        { header: 'Order #', key: 'orderId', width: 15 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Product', key: 'product', width: 30 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Discount', key: 'discount', width: 15 }
    ];

    let totalSalesAmount = 0;
    let totalDiscount = 0;

    orders.forEach(order => {
        order.items.forEach(item => {
            worksheet.addRow({
                orderId: order.orderId,
                date: order.createdAt.toDateString(),
                product: item.product.productName,
                quantity: item.quantity,
                price: (item.price / item.quantity).toFixed(2),
                total: item.price.toFixed(2),
                discount: item.couponDiscountAmt.toFixed(2)
            });

            totalSalesAmount += item.price;
            totalDiscount += item.couponDiscountAmt;
        });
    });

    worksheet.addRow([]);
    worksheet.addRow([
        'Total Sales',
        '',
        '',
        '',
        '',
        totalSalesAmount.toFixed(2),
        totalDiscount.toFixed(2)
    ]);

    worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true };
    worksheet.getCell(`F${worksheet.lastRow.number}`).font = { bold: true };
    worksheet.getCell(`G${worksheet.lastRow.number}`).font = { bold: true };

    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);
    res.end();
};


module.exports = { generateReport };

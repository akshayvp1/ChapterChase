
const PDFDocument = require('pdfkit');

const Order = require('../../models/orderModel');





const orderInvoice = async (req, res) => {
    try {
        const { orderId, productId } = req.query;

        const order = await Order.findOne({ orderId: orderId }).populate('items.product');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const item = order.items.find(item => item.product._id.toString() === productId);

        if (!item) {
            return res.status(404).send('Product not found in this order');
        }

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, left: 50, right: 50, bottom: 50 }
        });

        let filename = `invoice_${orderId}_${productId}.pdf`;
        filename = encodeURIComponent(filename);

        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        doc.image('assets/images/demos/demo-20/ChapterChase.png', 50, 45, { width: 50 })
           .fontSize(20)
           .text('ChapterChase', 110, 57)
           .fontSize(10)
           .text('Kerala, Tirur, India', 110, 80)
           .text('Phone: 6282031090| Email: chapterchase@gmail.com', 110, 95);

        doc.moveTo(50, 120).lineTo(550, 120).stroke();

        doc.fontSize(18).text('INVOICE', 50, 140, { align: 'center' });
        doc.fontSize(10)
           .text('Invoice Details:', 50, 170)
           .text(`Invoice Number: INV-${order.orderId}`, 50, 190)
           .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 205)
           .text(`Payment Status: ${order.payment_status}`, 50, 220);
        doc.fontSize(12).text('Bill To:', 350, 170)
        doc.fontSize(10)
           .text(`${order.address.addressName}`, 350, 190)
           .text(`${order.address.addressEmail}`, 350, 205)
           .text(`${order.address.addressMobile}`, 350, 220)
           .text(`${order.address.addressHouse}, ${order.address.addressStreet}`, 350, 235)
           .text(`${order.address.addressCity}, ${order.address.addressState} ${order.address.addressPin}`, 350, 250);

        // Table
        const tableTop = 280;
        const tableHeaders = ['Product', 'Quantity', 'Unit Price', 'Total'];
        const tableWidths = [220, 70, 100, 110];

        doc.font('Helvetica-Bold').fontSize(10);
        tableHeaders.forEach((header, i) => {
            doc.rect(50 + tableWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop, tableWidths[i], 20)
               .fillAndStroke('#f0f0f0', '#000000');
            doc.fillColor('#000000')
               .text(header, 50 + tableWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, tableTop + 5, {
                   width: tableWidths[i] - 10,
                   align: 'center'
               });
        });

        doc.font('Helvetica').fontSize(10);
        const rowTop = tableTop + 20;
        tableHeaders.forEach((_, i) => {
            doc.rect(50 + tableWidths.slice(0, i).reduce((a, b) => a + b, 0), rowTop, tableWidths[i], 20)
               .stroke();
        });

        doc.text(item.product.productName, 55, rowTop + 5, { width: tableWidths[0] - 10 })
           .text(item.quantity.toString(), 50 + tableWidths[0] + 5, rowTop + 5, { width: tableWidths[1] - 10, align: 'center' })
           .text(`${(item.price / item.quantity).toFixed(2)}`, 50 + tableWidths[0] + tableWidths[1] + 5, rowTop + 5, { width: tableWidths[2] - 10, align: 'right' })
           .text(`${item.price.toFixed(2)}`, 50 + tableWidths[0] + tableWidths[1] + tableWidths[2] + 5, rowTop + 5, { width: tableWidths[3] - 10, align: 'right' });
        const totalRowTop = rowTop + 20;
        tableHeaders.forEach((_, i) => {
            doc.rect(50 + tableWidths.slice(0, i).reduce((a, b) => a + b, 0), totalRowTop, tableWidths[i], 20)
               .stroke();
        });

        doc.font('Helvetica-Bold')
           .text('Total:', 50 + tableWidths[0] + 5, totalRowTop + 5, { width: tableWidths[1] + tableWidths[2] - 10, align: 'right' })
           .text(`${item.price.toFixed(2)}`, 50 + tableWidths[0] + tableWidths[1] + tableWidths[2] + 5, totalRowTop + 5, { width: tableWidths[3] - 10, align: 'right' });

      
        doc.font('Helvetica').fontSize(10)
           .text('Thank you for your business!', 50, 700, { align: 'center' })
           .text('For any questions, please contact our customer support.', 50, 715, { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Server error');
    }
};





module.exports={
    orderInvoice
}
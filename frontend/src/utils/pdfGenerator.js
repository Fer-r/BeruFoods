import jsPDF from 'jspdf';

export const generateOrderBill = (order, isRestaurantView = false) => {
  const doc = new jsPDF();
  
  // Set up document properties
  doc.setProperties({
    title: `Order Bill #${order.id}`,
    subject: 'Order Invoice',
    author: 'BeruFoods',
    creator: 'BeruFoods App'
  });

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('BeruFoods', 20, 25);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(isRestaurantView ? 'Restaurant Order Bill' : 'Order Receipt', 20, 35);

  // Order Info Box
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Information', 20, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Order ID: #${order.id}`, 20, 65);
  doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`, 20, 75);
  doc.text(`Status: ${order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'N/A'}`, 20, 85);
  
  // Restaurant info for user view
  if (!isRestaurantView && order.restaurant) {
    doc.text(`Restaurant: ${order.restaurant.name || `Restaurant ID: ${order.restaurant.id}`}`, 20, 95);
  }

  // Customer info for restaurant view
  let yPos = isRestaurantView ? 105 : 105;
  if (isRestaurantView && order.user) {
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information', 20, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    if (order.user.name) {
      doc.text(`Name: ${order.user.name}`, 20, yPos);
      yPos += 10;
    }
    if (order.user.email) {
      doc.text(`Email: ${order.user.email}`, 20, yPos);
      yPos += 10;
    }
    if (order.user.phone) {
      doc.text(`Phone: ${order.user.phone}`, 20, yPos);
      yPos += 10;
    }
  }

  // Items section
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Order Items', 20, yPos);
  yPos += 10;

  // Table headers
  doc.setFontSize(10);
  doc.text('Item', 20, yPos);
  doc.text('Qty', 120, yPos);
  doc.text('Unit Price', 140, yPos);
  doc.text('Total', 170, yPos);
  
  // Line under headers
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 12;

  // Items
  doc.setFont('helvetica', 'normal');
  let totalCalculated = 0;
  
  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      // Handle different data structures between restaurant and user views
      const itemName = item.articleName || `Article ID: ${item.articleId}`;
      const unitPrice = item.articlePrice || (item.articleDetail ? item.articleDetail.price : 0);
      const lineTotal = item.lineTotal || (unitPrice * item.quantity);
      
      totalCalculated += lineTotal;
      
      // Item name (truncate if too long)
      const truncatedName = itemName.length > 35 ? itemName.substring(0, 32) + '...' : itemName;
      doc.text(truncatedName, 20, yPos);
      doc.text(item.quantity.toString(), 125, yPos);
      doc.text(unitPrice > 0 ? `€${parseFloat(unitPrice).toFixed(2)}` : 'N/A', 140, yPos);
      doc.text(lineTotal > 0 ? `€${lineTotal.toFixed(2)}` : '-', 170, yPos);
      
      yPos += 10;
      
      // Add description if available
      if (item.articleDescription) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        const truncatedDesc = item.articleDescription.length > 50 ? 
          item.articleDescription.substring(0, 47) + '...' : item.articleDescription;
        doc.text(truncatedDesc, 25, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      }
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
    });
  }

  // Total line
  yPos += 5;
  doc.line(120, yPos, 190, yPos);
  yPos += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', 140, yPos);
  doc.text(`€${parseFloat(order.total_price).toFixed(2)}`, 170, yPos);

  // Show calculated vs stored total if different (for debugging)
  if (Math.abs(totalCalculated - parseFloat(order.total_price)) > 0.01) {
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Calculated: €${totalCalculated.toFixed(2)}`, 140, yPos);
  }

  // Footer
  yPos += 20;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Thank you for your business!', 20, yPos);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 20, yPos + 8);

  return doc;
};

export const downloadOrderBill = (order, isRestaurantView = false) => {
  try {
    const doc = generateOrderBill(order, isRestaurantView);
    const filename = `order-${order.id}-bill-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
}; 
import jsPDF from 'jspdf';

/**
 * Generates a PDF document for an order bill/receipt.
 * 
 * @param {Object} order - The order object containing details to include in the PDF
 * @param {boolean} isRestaurantView - Whether the PDF is being generated for restaurant view (true) or customer view (false)
 * @returns {jsPDF} The generated PDF document object
 */
export const generateOrderBill = (order, isRestaurantView = false) => {
  const doc = new jsPDF();
  
  // Set up document properties
  doc.setProperties({
    title: `Factura Pedido #${order.id}`,
    subject: 'Factura de Pedido',
    author: 'BeruFoods',
    creator: 'BeruFoods App'
  });

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('BeruFoods', 20, 25);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(isRestaurantView ? 'Factura de Pedido para Restaurante' : 'Recibo de Pedido', 20, 35);

  // Order Info Box
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Pedido', 20, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Pedido Nº: #${order.id}`, 20, 65);
  doc.text(`Fecha: ${new Date(order.created_at).toLocaleString('es-ES')}`, 20, 75);
  doc.text(`Estado: ${statusToSpanish(order.status)}`, 20, 85);
  
  // Restaurant info for user view
  if (!isRestaurantView && order.restaurant) {
    doc.text(`Restaurante: ${order.restaurant.name || `ID Restaurante: ${order.restaurant.id}`}`, 20, 95);
  }

  // Customer info for restaurant view
  let yPos = isRestaurantView ? 105 : 105;
  if (isRestaurantView && order.user) {
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Cliente', 20, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    if (order.user.name) {
      doc.text(`Nombre: ${order.user.name}`, 20, yPos);
      yPos += 10;
    }
    if (order.user.email) {
      doc.text(`Email: ${order.user.email}`, 20, yPos);
      yPos += 10;
    }
    if (order.user.phone) {
      doc.text(`Teléfono: ${order.user.phone}`, 20, yPos);
      yPos += 10;
    }
  }

  // Items section
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Artículos del Pedido', 20, yPos);
  yPos += 10;

  // Table headers
  doc.setFontSize(10);
  doc.text('Artículo', 20, yPos);
  doc.text('Cant.', 120, yPos);
  doc.text('Precio Unit.', 140, yPos);
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
      const itemName = item.articleName || `ID Artículo: ${item.articleId}`;
      const unitPrice = item.articlePrice || (item.articleDetail ? item.articleDetail.price : 0);
      const lineTotal = item.lineTotal || (unitPrice * item.quantity);
      
      totalCalculated += lineTotal;
      
      // Item name (truncate if too long)
      const truncatedName = itemName.length > 35 ? itemName.substring(0, 32) + '...' : itemName;
      doc.text(truncatedName, 20, yPos);
      doc.text(item.quantity.toString(), 125, yPos);
      doc.text(unitPrice > 0 ? `${parseFloat(unitPrice).toFixed(2)}€` : 'N/A', 140, yPos);
      doc.text(lineTotal > 0 ? `${lineTotal.toFixed(2)}€` : '-', 170, yPos);
      
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
  doc.text(`${parseFloat(order.total_price).toFixed(2)}€`, 170, yPos);

  // Show calculated vs stored total if different (for debugging)
  if (Math.abs(totalCalculated - parseFloat(order.total_price)) > 0.01) {
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Calculado: ${totalCalculated.toFixed(2)}€`, 140, yPos);
  }

  // Footer
  yPos += 20;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('¡Gracias por su compra!', 20, yPos);
  doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 20, yPos + 8);

  return doc;
};

/**
 * Generates and downloads a PDF bill for an order.
 * 
 * @param {Object} order - The order object containing details to include in the PDF
 * @param {boolean} isRestaurantView - Whether the PDF is being generated for restaurant view (true) or customer view (false)
 * @returns {Object} An object with success status and either filename or error message
 */
export const downloadOrderBill = (order, isRestaurantView = false) => {
  try {
    const doc = generateOrderBill(order, isRestaurantView);
    const filename = `pedido-${order.id}-factura-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    return { success: true, filename };
  } catch (error) {
    console.error('Error al generar PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Converts English order status to Spanish
 * 
 * @param {string} status - The order status in English
 * @returns {string} The order status in Spanish
 */
function statusToSpanish(status) {
  const statusMap = {
    'pending': 'Pendiente',
    'preparing': 'Preparando',
    'delivered': 'Entregado',
    'cancelled': 'Cancelado'
  };
  
  return statusMap[status] || status;
}
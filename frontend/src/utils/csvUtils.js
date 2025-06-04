/**
 * Parses a CSV row, handling quoted values and commas within quotes.
 * 
 * @param {string} row - A single row from a CSV file
 * @returns {string[]} An array of values from the row
 */
const parseCsvRow = (row) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

/**
 * Parses a CSV string into an array of article objects.
 * Validates required fields and formats data appropriately.
 * 
 * @param {string} content - The CSV content as a string
 * @returns {Object[]} An array of article objects with properties matching the CSV headers
 * @throws {Error} If the CSV is invalid or missing required columns
 */
export const parseArticleCsv = (content) => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }

  const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase().trim());
  const expectedHeaders = ['name', 'description', 'price'];
  
  // Check required headers
  for (const required of expectedHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  const articles = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i]);
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1}: Column count mismatch. Expected ${headers.length}, got ${values.length}`);
    }

    const article = {};
    headers.forEach((header, index) => {
      const value = values[index].trim();
      
      switch (header) {
        case 'name': {
          if (!value) throw new Error(`Row ${i + 1}: Name is required`);
          article.name = value;
          break;
        }
        case 'description': {
          article.description = value || '';
          break;
        }
        case 'price': {
          const price = parseFloat(value);
          if (isNaN(price) || price <= 0) {
            throw new Error(`Row ${i + 1}: Price must be a positive number`);
          }
          article.price = price.toString();
          break;
        }
        case 'listed': {
          article.listed = value.toLowerCase() === 'true' || value === '1';
          break;
        }
        case 'available': {
          article.available = value.toLowerCase() === 'true' || value === '1';
          break;
        }
        case 'allergies': {
          if (!value || value.trim() === '') {
            article.allergies = [];
          } else {
            article.allergies = value.split(';').map(a => a.trim()).filter(Boolean);
          }
          break;
        }
      }
    });

    // Set defaults for optional fields
    if (!headers.includes('listed')) article.listed = true;
    if (!headers.includes('available')) article.available = true;
    if (!headers.includes('allergies')) article.allergies = [];

    articles.push(article);
  }

  return articles;
};

/**
 * Generates a CSV template string with sample article data.
 * 
 * @returns {string} A CSV string with headers and sample data
 */
export const generateCsvTemplate = () => {
  return 'name,description,price,listed,available,allergies\n"Sample Pizza","Delicious cheese pizza with tomato sauce",12.99,true,true,"gluten;dairy"\n"Veggie Burger","Plant-based burger with fresh vegetables",10.50,true,true,""';
};

/**
 * Creates and triggers download of a CSV template file.
 * 
 * @returns {void}
 */
export const downloadCsvTemplate = () => {
  const template = generateCsvTemplate();
  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'articles_template.csv';
  link.click();
  URL.revokeObjectURL(url);
};
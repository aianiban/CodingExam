
var config = require("./config");
const sql = require('mssql');
const express = require('express');
const winston = require('winston');

//log file functionality
const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(info => {
        return `${info.timestamp} - ${info.message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'log.txt' })
    ]
  });

const app = express();

//routes
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
  res.render('index');
});

// route to fetch customers information
app.get('/customers', (req, res) => {
    // logging the database connection event
    logger.info('Connecting to database...');

    // connect to the database
    sql.connect(config, err => {
        if (err) {
            logger.error('Error connecting to database:', err);
            res.status(500).send('Error connecting to database');
        } else {
            logger.info('Connected to database');
            
            // SQL query to fetch customer information
            const query = `SELECT c.CustomerID, c.FirstName + ' ' + c.LastName AS FullName, a.AddressLine1, a.AddressLine2, a.City, a.StateProvince, a.PostalCode, a.CountryRegion FROM SalesLT.Customer c INNER JOIN SalesLT.CustomerAddress ca ON c.CustomerID = ca.CustomerID INNER JOIN SalesLT.Address a ON ca.AddressID = a.AddressID WHERE ca.AddressType = 'Shipping'`;

            // fetching customer info
            new sql.Request().query(query, (err, results) => {
                if (err) {
                    logger.error('Error fetching customer information:', err);
                    res.status(500).send('Error fetching customer information');
                } else {
                    logger.info('Fetched customer information:', results);

                    // display customer information table
                    res.send(`<table><thead><tr><th>CustomerID</th><th>Full Name</th><th>Address Line 1</th><th>Address Line 2</th><th>City</th><th>State Province</th><th>Postal Code</th><th>Country Region</th></tr></thead><tbody>${results.recordset.map(record => `<tr><td>${record.CustomerID}</td><td>${record.FullName}</td><td>${record.AddressLine1}</td><td>${record.AddressLine2 || ''}</td><td>${record.City}</td><td>${record.StateProvince}</td><td>${record.PostalCode}</td><td>${record.CountryRegion}</td></tr>`).join('')}</tbody></table>`);
                }

                sql.close();
            });
        }
    });
});


//route to fetch orders information
app.get('/orders', (req, res) => {
    //connecting to the database
    sql.connect(config, err => {
        if (err) {
            logger.error('Error connecting to database:', err);
            res.status(500).send('Error connecting to database');
        } else {
            logger.info('Connected to database');

            // SQL query to fetch order information
            const query = `SELECT h.SalesOrderID, h.Orderdate, h.DueDate, h.ShipDate, d.OrderQty, d.LineTotal, p.Name, p.ProductNumber FROM SalesLT.Product p INNER JOIN SalesLT.SalesOrderDetail d ON p.ProductID = d.ProductID INNER JOIN SalesLT.SalesOrderHeader h ON d.SalesOrderID = h.SalesOrderID ORDER BY DueDate ASC`;

            // fetching orders info
            new sql.Request().query(query, (err, results) => {
                if (err) {
                    logger.error('Error fetching order information:', err);
                    res.status(500).send('Error fetching order information');
                } else {
                    logger.info('Fetched order information:', results);

                    // display orders info table
                    res.send(`<table><thead><tr><th>CustomerID</th><th>OrderDate</th><th>ShippingDate</th><th>DueDate</th><th>Quantity</th><th>TotalAmount</th><th>ProductName</th><th>ProductCode</th></tr></thead><tbody>${results.recordset.map(record => `<tr><td>${record.SalesOrderID}</td><td>${record.Orderdate.toLocaleString()}</td><td>${record.DueDate.toLocaleString()}</td><td>${record.ShipDate.toLocaleString()}</td><td>${record.OrderQty}</td><td>${record.LineTotal}</td><td>${record.Name}</td><td>${record.ProductNumber}</td></tr>`).join('')}</tbody></table>`);
                }

                sql.close();
            });
        }
    });
});

// start sever
app.listen(3000, () => {
    logger.info('Server started on port 3000');
});

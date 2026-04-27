-- Simple SQL to change password to something without special chars
ALTER USER 'ponp9455_bpi'@'localhost' IDENTIFIED BY 'ponp_bpi_123';
ALTER USER 'ponp9455_bpi'@'127.0.0.1' IDENTIFIED BY 'ponp_bpi_123';
GRANT ALL PRIVILEGES ON ponp9455_bpi.* TO 'ponp9455_bpi'@'localhost';
GRANT ALL PRIVILEGES ON ponp9455_bpi.* TO 'ponp9455_bpi'@'127.0.0.1';
FLUSH PRIVILEGES;

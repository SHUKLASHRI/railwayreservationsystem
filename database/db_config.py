# Database Configuration

import mysql.connector
from mysql.connector import Error

class Database:
    def __init__(self, host, database, user, password):
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.connection = None

    def create_connection(self):
        """ Create a database connection to the MySQL database """
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password
            )
            if self.connection.is_connected():
                print("Connected to MySQL database")
        except Error as e:
            print(f"Error: '{e}'")
            self.connection = None

    def close_connection(self):
        if self.connection.is_connected():
            self.connection.close()
            print("MySQL connection closed")

# Usage example:
# db = Database(host='localhost', database='your_database', user='your_username', password='your_password')
# db.create_connection()  
# // Perform queries...  
# db.close_connection()  

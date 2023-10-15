import mysql.connector

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'mysql',
}

def connect():
    connection = mysql.connector.connect(**db_config)
    return connection

def create_table():
    connection = connect()
    cursor = connection.cursor()

    create_table_query = """
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL
    )
    """

    cursor.execute(create_table_query)
    connection.commit()

    cursor.close()
    connection.close()

def insert_user(username, email):
    connection = connect()
    cursor = connection.cursor()

    insert_query = "INSERT INTO users (username, email) VALUES (%s, %s)"
    user_data = (username, email)

    cursor.execute(insert_query, user_data)
    connection.commit()

    cursor.close()
    connection.close()

def get_all_users():
    connection = connect()
    cursor = connection.cursor()

    select_query = "SELECT * FROM users"

    cursor.execute(select_query)
    users = cursor.fetchall()

    cursor.close()
    connection.close()

    return users

if __name__ == "__main__":
    create_table()

    insert_user("user5", "user5@example.com")  # Provide both username and email
    insert_user("user6", "user6@example.com")  # Provide both username and email

    users = get_all_users()
    for user in users:
        print(user)
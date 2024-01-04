import os
from datetime import datetime
from io import BytesIO

import mysql.connector
from flask import Flask, request, jsonify, make_response, send_file, redirect, url_for, current_app
from flask_cors import CORS
import jwt
import uuid

from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': '8',
}

SECRET_KEY = 'your_secret_key'
db = mysql.connector.connect(**db_config)

cursor = db.cursor(dictionary=True)

username = 'cyn'

app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(),'petouploads', username, 'uploads', '000a0776-96ca-4fdf-af18-91d70eb21daf')

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', "pptx", "rar", "zip"}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/login', methods=['POST'])
def user_login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')
    app.logger.debug(f"Received subscriber_username: {username}, target_username: {password}")

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user and user['password'] == password:
            session_id = str(uuid.uuid4())

            token_payload = {'username': username, 'session_id': session_id}
            token = jwt.encode(token_payload, SECRET_KEY, algorithm='HS256')

            response = {'success': True, 'token': token, 'session_id': session_id, 'message': 'Login successful', 'user_id': user['user_id']}

            response['username'] = username

            return jsonify(response)
        else:
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
@app.route('/api/register', methods=['POST'])
def user_register():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        insert_query = "INSERT INTO users (username, password) VALUES (%s, %s)"
        cursor.execute(insert_query, (username, password))
        conn.commit()

        files_table_query = f"""
        CREATE TABLE IF NOT EXISTS {username}_files (
            file_id VARCHAR(36) PRIMARY KEY,
            file_name VARCHAR(255),
            folder_id VARCHAR(36),
            file_size INT,
            username VARCHAR(255),
            file_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_public TINYINT(1) DEFAULT 0
        );
        """
        cursor.execute(files_table_query)

        folders_table_query = f"""
            CREATE TABLE IF NOT EXISTS {username}_folders (
                folder_id VARCHAR(36) PRIMARY KEY,
                folder_name VARCHAR(255),
                folder_path VARCHAR(255),
                username VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                parent_folder_id VARCHAR(36),
                parent_folder_name VARCHAR(255)
            );
            """
        cursor.execute(folders_table_query)

        comments_table_query = f"""
            CREATE TABLE IF NOT EXISTS {username}_comments (
                comment_id INT AUTO_INCREMENT PRIMARY KEY,
                comment_text TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_id VARCHAR(36),
                username VARCHAR(255),
                user_id INT
            );
            """
        cursor.execute(comments_table_query)

        notifications_table_query = f"""
        CREATE TABLE IF NOT EXISTS {username}_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            message TEXT,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            username VARCHAR(255),
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        );
        """
        cursor.execute(notifications_table_query)

        return jsonify({'success': True, 'message': 'Registration successful'})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return jsonify({'success': False, 'message': 'Registration failed'})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/user-info', methods=['OPTIONS', 'GET'])
def get_user_info():
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
        return make_response('', 200, headers)
    elif request.method == 'GET':
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        try:
            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor()
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            username = decoded_token.get('username')

            cursor.execute("SELECT user_id, username, tier FROM users WHERE username = %s", (username,))
            user_info = cursor.fetchone()

            if user_info:
                user_info_dict = {
                    'user_id': user_info[0],
                    'username': user_info[1],
                    'tier': user_info[2]
                }

                return jsonify(user_info_dict)
            else:
                return jsonify({'error': 'User not found'}), 404

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        finally:
            cursor.close()

@app.route('/api/user-files-info', methods=['OPTIONS', 'GET'])
def get_user_files_info():
    global cursor
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
        return make_response('', 200, headers)
    elif request.method == 'GET':
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        try:
            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor()
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            username = decoded_token.get('username')
            table = f"{username}_files"

            cursor.execute(f"SELECT u.user_id, u.username, u.tier, f.file_size FROM users u LEFT JOIN {table} f ON u.username = f.username WHERE u.username = %s", (username,))
            result = cursor.fetchall()

            if result:
                user_info = {
                    'user_id': result[0][0],
                    'username': result[0][1],
                    'tier': result[0][2]
                }
                user_files = []

                for row in result:
                    if row[3] is not None:
                        user_files.append({
                            'file_size': row[3]
                        })

                user_info['files'] = user_files

                return jsonify(user_info)
            else:
                return jsonify({'error': 'User not found'}), 404

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        finally:
            cursor.close()

@app.route('/api/user-info/<username>', methods=['GET'])
def get_user_info_profile(username):
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    if user is not None:
        user_info = {
            'user_id': user['user_id'],
            'username': user['username'],
        }
        return jsonify(user_info)
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/api/folders/<folder_id>', methods=['GET'])
def get_folder_details(folder_id):
    folders, files = get_files_and_folders_by_folder_id(folder_id)

    response = {
        "success": True,
        "data": {
            "folders": folders,
            "files": files
        }
    }

    return jsonify(response)

@app.route('/api/files', methods=['GET'])
def get_files_and_folders():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')
        folder_id = request.args.get('folder_id')

        if folder_id:
            folders, files = get_files_and_folders_by_folder_id(username, folder_id)
        else:
            folders, files = get_top_level_files_and_folders(username)

        response = {
            "success": True,
            "data": {
                "folders": folders,
                "files": files
            }
        }

        return jsonify(response)

    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

def get_files_and_folders_by_folder_id(username, folder_id):
    cursor = db.cursor(dictionary=True)

    try:
        select_folders_query = """
            SELECT * FROM {}_folders
            WHERE parent_folder_id = %s
        """.format(username)
        cursor.execute(select_folders_query, (folder_id,))
        folders = cursor.fetchall()

        select_files_query = """
            SELECT * FROM {}_files
            WHERE folder_id = %s
        """.format(username)
        cursor.execute(select_files_query, (folder_id,))
        files = cursor.fetchall()

    finally:
        cursor.close()

    return folders, files

def get_top_level_files_and_folders(username):
    cursor = db.cursor(dictionary=True)

    try:
        select_top_level_folders_query = """
            SELECT * FROM {}_folders
            WHERE parent_folder_id IS NULL
        """.format(username)
        cursor.execute(select_top_level_folders_query)
        folders = cursor.fetchall()

        select_top_level_files_query = """
            SELECT * FROM {}_files
            WHERE folder_id IS NULL
        """.format(username)
        cursor.execute(select_top_level_files_query)
        files = cursor.fetchall()

    finally:
        cursor.close()

    return folders, files
@app.route('/api/public-files', methods=['GET'])
def get_public_files():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    try:
        select_files_query = """
            SELECT * FROM public
        """
        cursor.execute(select_files_query)
        public_files = cursor.fetchall()

        if public_files:
            return jsonify({"success": True, "data": public_files})
        else:
            return jsonify({"success": False, "error": "No public files found"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()

@app.route('/api/fileDetails', methods=['GET'])
def get_file_details():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    app.logger.debug(f"token: {token}")
    file_id = request.args.get('fileId')
    username = request.headers.get('username')
    app.logger.debug(f"username: {username}")

    if not file_id:
        return jsonify({"success": False, "error": "File ID is required"})

    cursor = db.cursor()

    try:
        select_file_query = """
            SELECT * FROM {}_files
            WHERE file_id = %s
        """.format(username)

        cursor.execute(select_file_query, (file_id,))
        file_details = cursor.fetchone()

        if file_details:
            return jsonify({"success": True, "data": file_details})
        else:
            return jsonify({"success": False, "error": "File details not found"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()

@app.route('/api/fileDetails', methods=['GET'])
def get_check_file_details():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    app.logger.debug(f"token: {token}")
    file_id = request.args.get('fileId')
    username = request.args.get('username')

    if not file_id:
        return jsonify({"success": False, "error": "File ID is required"})

    cursor = db.cursor()

    try:
        select_file_query = """
            SELECT is_public FROM {}_files
            WHERE file_id = %s
        """.format(username)
        cursor.execute(select_file_query, (file_id,))
        file_details = cursor.fetchone()

        if file_details:
            return jsonify({"success": True, "data": file_details})
        else:
            return jsonify({"success": False, "error": "File details not found"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()


@app.route('/api/upload1', methods=['POST'])
def upload_files_and_folders():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')
        if 'files[]' not in request.files:
            return jsonify({'success': False, 'error': 'No files provided'}), 400

        files = request.files.getlist('files[]')
        username = request.form.get('username')
        parent_folder_id = request.form.get('parent_folder_id')
        parent_folder_name = request.form.get('parentFolderName')

        parent_folder_id = create_folder(username, parent_folder_id=None, parent_folder_name=None)

        child_folder_id = create_folder(username, parent_folder_id=parent_folder_id, parent_folder_name=parent_folder_name)

        if not child_folder_id:
            return jsonify({"error": "Failed to create child folder"}), 500

        for file in files:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], username, 'uploads', child_folder_id, filename)

            folder_path = os.path.dirname(file_path)
            if not os.path.exists(folder_path):
                os.makedirs(folder_path)

            file.save(file_path)

            create_file(filename, child_folder_id, username, file_path)

        return jsonify({"message": "Files and child folder uploaded successfully"}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    finally:
        cursor.close()

def create_folder(username, parent_folder_id=None, parent_folder_name=None):
    folder_name = request.form.get('folderName')
    if not folder_name:
        return jsonify({"error": "Folder name not provided"}), 400

    if parent_folder_id:
        parent_folder_path = get_folder_path(parent_folder_id, username)
        if not parent_folder_path:
            return jsonify({"error": "Parent folder not found"}), 404

        folder_path = os.path.join(parent_folder_path, folder_name)
    else:
        folder_path = os.path.join(app.config['UPLOAD_FOLDER'], username, 'uploads', folder_name)

    if os.path.exists(folder_path):
        return jsonify({"error": "Folder already exists"}), 400

    cursor = db.cursor(dictionary=True)

    try:
        table = f"{username}_folders"
        select_folder_query = """
            SELECT * FROM {}
            WHERE folder_name = %s AND username = %s AND parent_folder_id = %s
        """.format(table)

        cursor.execute(select_folder_query, (folder_name, username, parent_folder_id))
        result = cursor.fetchone()
        if result:
            return jsonify({"error": "Folder already exists in the database"}), 400

        insert_folder_query = """
            INSERT INTO {} (folder_id, username, folder_name, folder_path, parent_folder_id, parent_folder_name)
            VALUES (%s, %s, %s, %s, %s, %s)
        """.format(table)

        folder_id = str(uuid.uuid4())

        parent_folder_id = parent_folder_id if parent_folder_id else None
        parent_folder_name = parent_folder_name if parent_folder_name else None

        cursor.execute(insert_folder_query, (folder_id, username, folder_name, folder_path, parent_folder_id, parent_folder_name))
        db.commit()
    finally:
        cursor.close()

    return folder_id
def get_folder_path(folder_id, username):
    cursor = db.cursor(dictionary=True)
    try:
        table = f"{username}_folders"
        select_folder_query = """
            SELECT folder_path FROM {}
            WHERE folder_id = %s AND username = %s
        """.format(table)
        cursor.execute(select_folder_query, (folder_id, username))
        result = cursor.fetchone()
        return result['folder_path'] if result else None
    finally:
        cursor.close()

def create_file(file_name, folder_id, username, file_path):
    cursor = db.cursor()
    file_size = os.path.getsize(file_path)
    file_id = str(uuid.uuid4())
    table = f"{username}_files"
    cursor.execute("""
        INSERT INTO {} (file_id, file_name, folder_id, file_size, username, file_path)
        VALUES (%s, %s, %s, %s, %s, %s)
    """.format(table), (file_id, file_name, folder_id, file_size, username, file_path))

    db.commit()
    cursor.close()
@app.route('/api/download/<file_id>', methods=['GET'])
def download_file(file_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')
        app.logger.debug(username)
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT file_path FROM {}_files WHERE file_id = %s AND username = %s".format(username), (file_id, username))
        file_info = cursor.fetchone()

        if file_info:
            file_path = file_info['file_path']

            if os.path.exists(file_path):
                return send_file(file_path, as_attachment=True)
            else:
                return jsonify({'success': False, 'error': 'File not found on the server'}), 404
        else:
            return jsonify({'success': False, 'error': 'File not found in the database'}), 404

    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    finally:
        cursor.close()



@app.route('/api/make-public/<file_id>', methods=['POST'])
def make_file_public(file_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    cursor = db.cursor(dictionary=True)
    if not token:
        return jsonify({'success': False, 'error': 'Token not provided'}), 401

    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')

        cursor.execute("SELECT user_id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        cursor.execute("SELECT * FROM {}_files WHERE file_id = %s".format(username), (file_id,))
        file_data = cursor.fetchone()

        if not file_data:
            return jsonify({'success': False, 'error': 'File not found'}), 404

        if file_data['user_id'] != user['user_id']:
            return jsonify({'success': False, 'error': 'User ID mismatch'}), 400

        cursor.execute("SELECT * FROM public WHERE file_id = %s", (file_id,))
        public_file_data = cursor.fetchone()

        if public_file_data:
            return jsonify({'success': False, 'error': 'File is already public'}), 400

        cursor.execute(
            "INSERT INTO public (file_id, file_name, folder_id, file_size, username, file_path, user_id) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (
                file_id,
                file_data['file_name'],
                file_data['folder_id'],
                file_data['file_size'],
                username,
                file_data['file_path'],
                user['user_id'],
            )
        )
        cursor.execute("UPDATE {}_files SET is_public = 1 WHERE file_id = %s".format(username), (file_id,))

        db.commit()

        return jsonify({'success': True, 'message': 'File is now public'})
    except jwt.exceptions.DecodeError as e:
        return jsonify({'success': False, 'error': 'Invalid token format'}), 401
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({'success': False, 'error': str(err)}), 500
    finally:
        cursor.close()

@app.route('/api/make-private/<file_id>', methods=['POST'])
def make_file_private(file_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    cursor = db.cursor(dictionary=True)
    if not token:
        return jsonify({'success': False, 'error': 'Token not provided'}), 401

    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')

        cursor.execute("SELECT user_id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        cursor.execute("SELECT * FROM {}_files WHERE file_id = %s".format(username), (file_id,))
        file_data = cursor.fetchone()

        if not file_data:
            return jsonify({'success': False, 'error': 'File not found'}), 404

        if file_data['user_id'] != user['user_id']:
            return jsonify({'success': False, 'error': 'Unauthorized action'}), 403

        cursor.execute("UPDATE {}_files SET is_public = 0 WHERE file_id = %s".format(username), (file_id,))


        cursor.execute("DELETE FROM public WHERE file_id = %s", (file_id,))

        db.commit()

        return jsonify({'success': True, 'message': 'File is now private'})

    except jwt.exceptions.DecodeError as e:
        db.rollback()
        return jsonify({'success': False, 'error': 'Invalid token format'}), 401
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'error': str(e)})
    finally:
        cursor.close()

@app.route('/search', methods=['GET'])
def search():
    try:
        cursor = db.cursor(dictionary=True)

        query = request.args.get('query')

        if not query:
            return jsonify({'success': False, 'error': 'Query parameter is missing'}), 400

        search_query = "SELECT * FROM files WHERE file_name LIKE %s"
        cursor.execute(search_query, ('%' + query + '%',))

        files = cursor.fetchall()

        cursor.close()

        return jsonify({'success': True, 'files': files})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/files/<path:folder>', methods=['GET'])
def get_folder_contents(folder):
    BASE_FOLDER = 'uploads'
    folder_path = os.path.join(BASE_FOLDER, folder)

    if not os.path.exists(folder_path):
        return jsonify({'success': False, 'error': 'Folder not found'}), 404

    folder_contents = []

    for item in os.listdir(folder_path):
        item_path = os.path.join(folder_path, item)
        is_folder = os.path.isdir(item_path)
        size = os.path.getsize(item_path) if not is_folder else 0

        folder_contents.append({
            'filename': item,
            'is_folder': is_folder,
            'size': size
        })

    return jsonify({'success': True, 'files': folder_contents})

@app.route('/api/files/<file_id>', methods=['GET'])
def get_file_by_id(file_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    decoded_token = jwt.decode(token, algorithms=['HS256'])
    username = decoded_token.get('username')
    table = f"{username}_files"
    cursor.execute(f"SELECT * FROM {table} WHERE file_id = %s", (file_id,)).format(table)
    file_data = cursor.fetchone()

    if file_data:
        file_details = {
            'file_id': file_data['file_id'],
            'filename': file_data['filename'],
            'user_id': file_data['user_id'],
            'username': file_data['username'],
            'created_at': file_data['created_at'],
            'file_size': file_data['file_size'],
        }
        return jsonify({'success': True, 'file_details': file_details})
    else:
        return jsonify({'success': False, 'error': 'File not found'}), 404

@app.route('/api/comments/<file_id>', methods=['GET'])
def get_comments_by_file_id(file_id):
    conn = mysql.connector.connect(**db_config)
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    username = decoded_token.get('username')
    app.logger.debug(f"username in comments: {token}")
    table = f"{username}_comments"

    try:
        cursor = conn.cursor(dictionary=True)
        select_folder_query = "SELECT * FROM {}_comments WHERE file_id = %s".format(username)
        cursor.execute(select_folder_query, (file_id,))
        comments = cursor.fetchall()

        comment_list = [
            {
                'comment_id': comment['comment_id'],
                'username': comment['username'],
                'comment_text': comment['comment_text'],
                'created_at': comment['created_at'].isoformat(),
            } for comment in comments
        ]

        return jsonify({'success': True, 'comments': comment_list})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/comments/<file_id>', methods=['POST'])
def post_comment(file_id):
    data = request.get_json()
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = decoded_token.get('user_id')
        username = decoded_token.get('username')
        app.logger.debug(f"username in comments: {username}")
        table = f"{username}_comments"

        comment_text = data.get('commentText')

        insert_query = "INSERT INTO {} (file_id, user_id, username, comment_text) VALUES (%s, %s, %s, %s)".format(table)
        cursor.execute(insert_query, (file_id, user_id, username, comment_text))
        conn.commit()

        return jsonify({'success': True, 'message': 'Comment added successfully'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()
@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    data = request.get_json()
    subscriber_username = data.get('subscriberUsername')
    target_username = data.get('targetUsername')

    if not subscriber_username or not target_username:
        return jsonify({"success": False, "error": "Invalid data"}), 400

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT user_id FROM users WHERE username = %s", (subscriber_username,))
    subscriber_user = cursor.fetchone()
    cursor.execute("SELECT user_id FROM users WHERE username = %s", (target_username,))
    target_user = cursor.fetchone()

    if not subscriber_user or not target_user:
        return jsonify({"success": False, "error": "Invalid usernames"}), 400

    subscriber_id = subscriber_user['user_id']
    target_user_id = target_user['user_id']

    cursor.execute("SELECT * FROM subscribe WHERE subscriber_id = %s AND target_user_id = %s", (subscriber_id, target_user_id))
    existing_subscription = cursor.fetchone()

    if existing_subscription:
        return jsonify({"success": False, "error": "Already subscribed"}), 400

    cursor.execute("INSERT INTO subscribe (subscriber_id, target_user_id) VALUES (%s, %s)", (subscriber_id, target_user_id))
    db.commit()

    return jsonify({"success": True})

@app.route('/api/check-subscription', methods=['POST'])
def check_subscription():
    data = request.get_json()
    subscriber_username = data.get('subscriberUsername')
    target_username = data.get('targetUsername')

    app.logger.debug(f"Received subscriber_username: {subscriber_username}, target_username: {target_username}")

    if not subscriber_username or not target_username:
        return jsonify({"success": False, "error": "Invalid data"}), 400

    try:
        cursor = db.cursor(dictionary=True)

        cursor.execute("SELECT user_id FROM users WHERE username = %s", (subscriber_username,))
        subscriber_user = cursor.fetchone()
        cursor.execute("SELECT user_id FROM users WHERE username = %s", (target_username,))
        target_user = cursor.fetchone()

        if not subscriber_user or not target_user:
            return jsonify({"success": False, "error": "Invalid usernames"}), 400

        subscriber_id = subscriber_user['user_id']
        target_user_id = target_user['user_id']

        cursor.execute("SELECT * FROM subscribe WHERE subscriber_id = %s AND target_user_id = %s", (subscriber_id, target_user_id))
        existing_subscription = cursor.fetchone()

        if existing_subscription:
            return jsonify({"isSubscribed": True})
        else:
            return jsonify({"isSubscribed": False})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        cursor.close()

@app.route('/api/send-notification', methods=['POST'])
def send_notification():
    data = request.get_json()
    subscriber_username = data.get('subscriberUsername')
    message = data.get('message')
    app.logger.debug(f"Received subscriber_username: {subscriber_username}, target_username: {message}")

    if not subscriber_username or not message:
        return jsonify({"success": False, "error": "Invalid data"}), 400

    cursor.execute("SELECT user_id FROM users WHERE username = %s", (subscriber_username,))
    subscriber_user = cursor.fetchone()

    if not subscriber_user:
        return jsonify({"success": False, "error": "Invalid usernames"}), 400
    user_id = subscriber_user['user_id']
    notification_id = str(uuid.uuid4())

    table = f"{subscriber_username}_notifications"
    cursor.execute(
        "INSERT INTO {}(user_id, message, username) VALUES (%s, %s, %s)".format(table),
        (user_id, message, subscriber_username)
    )
    db.commit()

    return jsonify({"success": True, "notification_id": notification_id})
@app.route('/api/check-notification', methods=['GET'])
def check_notifications():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')
        app.logger.debug(f"Received subscriber_username: {username}")

        cursor = db.cursor(dictionary=True)
        table_name = f"{username}_notifications"
        cursor.execute("SELECT * FROM {} WHERE username = %s AND is_read = 0".format(table_name), (username,))
        unread_notifications = cursor.fetchall()

        db.commit()

        count_unread_notifications = len(unread_notifications)

        return jsonify({'unreadNotificationsCount': count_unread_notifications, 'unreadNotifications': unread_notifications})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        cursor.close()

@app.route('/api/update-tier', methods=['POST'])
def update_tier():

    try:
        data = request.get_json()
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = data.get('username')
        new_tier = data.get('tier')


        if decoded_token.get('username') != username:
            return jsonify({'error': 'Invalid token'}), 401

        cursor = db.cursor(dictionary=True)
        cursor.execute("UPDATE users SET tier = %s WHERE username = %s", (new_tier, username))
        db.commit()

        return jsonify({'message': 'Tier updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
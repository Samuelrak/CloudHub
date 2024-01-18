import os
import subprocess
from datetime import datetime
from io import BytesIO

import mysql.connector
from flask import Flask, request, jsonify, make_response, send_file, redirect, url_for, current_app
from flask_cors import CORS
import jwt
import uuid
from werkzeug.utils import secure_filename
from openai import OpenAI
from google.cloud import videointelligence
from google.cloud import vision_v1
from google.protobuf.json_format import MessageToJson
from sklearn.ensemble import RandomForestClassifier
import numpy as np
import psycopg2


app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': '10',
}

SECRET_KEY = 'your_secret_key'
import os
import base64
os.environ['OPENAI_API_KEY'] =  "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"
db1 = mysql.connector.connect(**db_config)
db = psycopg2.connect(**db_config)
video_client = videointelligence.VideoIntelligenceServiceClient()
image_client = vision_v1.ImageAnnotatorClient()
cursor = db.cursor(dictionary=True)
UPLOAD_FOLDER = app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(),'petouploads', 'uploads')

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
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    username = data.get('username')
    password = data.get('password')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    date_of_birth = data.get('dateOfBirth')
    gender = data.get('gender')
    address = data.get('address')
    phone_number = data.get('phoneNumber')
    email = data.get('email')

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        insert_query = "INSERT INTO users (username, password, firstName, lastName, dateOfBirth, gender, address, phoneNumber, email) " \
                       "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(insert_query, (username, password, first_name, last_name, date_of_birth, gender, address, phone_number, email))
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
            is_public TINYINT(1) DEFAULT 0,
            user_id INT,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
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
                parent_folder_name VARCHAR(255),
                user_id INT,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
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
                target_username varchar(255),
                user_id INT,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
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

@app.route('/api/admin/users', methods=['GET'])
def users_infor():
    try:
        cursor.execute("SELECT user_id, username FROM users")

        data = cursor.fetchall()

        response = jsonify(data)
        return response
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/admin/user-files/<string:username>', methods=['GET'])
def get_user_files(username):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user is None:
            return jsonify({'error': 'User not found'})

        username = user[0]
        table = f"{username}_files"

        cursor.execute(f'SELECT * FROM {table}')
        user_files = cursor.fetchall()

        formatted_user_files = []
        for file in user_files:
            formatted_user_files.append({
                'file_id': file[0],
                'file_name': file[1],
                'folder_id': file[2],
                'file_size': file[3],
                'username': file[4],
                'file_path': file[5],
                'created_at': file[6],
                'is_public': file[7],
                'user_id': file[8]

            })

        return jsonify(formatted_user_files)

    except Exception as e:
        return jsonify({'error': str(e)})
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

            cursor.execute(f"SELECT u.user_id, u.username, u.tier, f.file_size, f.created_at FROM users u LEFT JOIN {table} f ON u.username = f.username WHERE u.username = %s", (username,))
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
                            'file_size': row[3],
                            'created_at': row[4]
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

@app.route('/api/user-files-info1', methods=['OPTIONS', 'GET'])
def get_user_files_info_1():

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

            cursor.execute(f"SELECT u.user_id, u.username, u.tier, f.file_size, f.created_at FROM users u LEFT JOIN {table} f ON u.username = f.username WHERE u.username = %s", (username,))
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
                            'file_size': row[3],
                            'created_at': row[4]
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


@app.route('/api/user-files-info-public', methods=['OPTIONS', 'GET'])
def get_user_public_files_info():

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
            target_username = request.args.get('targetUsername')
            app.logger.debug('use',  target_username)

            cursor.execute(f"SELECT u.user_id, u.username, u.tier, f.file_size, f.created_at FROM users u LEFT JOIN public f ON u.username = f.username WHERE u.username = %s", (target_username,))
            result = cursor.fetchall()
            if result:
                user_info = {
                    'user_id': result[0][0],
                    'username': result[0][1],
                    'tier': result[0][2]
                }
                user_files = []

                for row in result:
                    if row[4] is not None:
                        user_files.append({
                            'file_size': row[4],
                            'created_at': row[0]
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
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    if user is not None:
        user_info = {
            'user_id': user[0],
            'password': user[1],
            'username': user[10],
            'tier': user[9],
            'firstName': user[2],
            'lastName': user[3],
            'dateOfBirth': user[4],
            'gender': user[5],
            'address': user[6],
            'phoneNumber': user[7],
            'email': user[8],
            'photo': convert_blob_to_base64(user[12]),
            'isadmin': user[11],
        }
        return jsonify(user_info)
    else:
        return jsonify({'error': 'User not found'}), 404

def convert_blob_to_base64(blob_data):
    if blob_data is None:
        return None
    else:
        if isinstance(blob_data, bytes):
            base64_data = base64.b64encode(blob_data).decode('utf-8')
            return base64_data
        else:
            return blob_data

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
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=25, type=int)
    search_query = request.args.get('searchQuery', default='', type=str)
    sort = request.args.get('sort', default='date', type=str)

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    try:
        if search_query:
            select_files_query = """
                    SELECT * FROM public
                    WHERE file_name LIKE %s
                    ORDER BY CASE 
                        WHEN %s = 'size' THEN file_size 
                        ELSE created_at
                    END
                    LIMIT %s OFFSET %s
                """
            offset = (page - 1) * per_page
            search_pattern = f"%{search_query}%"
            cursor.execute(select_files_query, (search_pattern, sort, per_page, offset))
        else:
            select_files_query = """
                    SELECT * FROM public
                    ORDER BY CASE 
                        WHEN %s = 'size' THEN file_size 
                        ELSE created_at
                    END
                    LIMIT %s OFFSET %s
                """
            offset = (page - 1) * per_page
            cursor.execute(select_files_query, (sort, per_page, offset))

        public_files = cursor.fetchall()

        if public_files:
            return jsonify({"success": True, "data": public_files})
        else:
            return jsonify({"success": False, "error": "No public files found"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()

@app.route('/api/upload-photo', methods=['POST'])
def upload_photo():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')

        photo_data = request.files['photo']

        cursor = db.cursor()

        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        if photo_data:

            photo_binary = photo_data.read()


            cursor.execute("UPDATE users SET photo = %s WHERE username = %s", (photo_binary, username))
            db.commit()

            return jsonify({"success": True, "message": "Photo uploaded successfully"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()



@app.route('/api/public-files-user-profile', methods=['GET'])
def get_public_files_user():
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=25, type=int)
    search_query = request.args.get('searchQuery', default='', type=str)
    sort = request.args.get('sort', default='date', type=str)
    username = request.args.get('username', default='', type=str)

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    try:
        if search_query:
            select_files_query = """
                    SELECT * FROM public
                    WHERE file_name LIKE %s AND username LIKE %s  # Use LIKE for username
                    ORDER BY CASE 
                        WHEN %s = 'size' THEN file_size 
                        ELSE created_at
                    END
                    LIMIT %s OFFSET %s
                """
            offset = (page - 1) * per_page
            search_pattern = f"%{search_query}%"
            username_pattern = f"%{username}%"
            cursor.execute(select_files_query, (search_pattern, username_pattern, sort, per_page, offset))
        else:
            select_files_query = """
                    SELECT * FROM public
                    WHERE username LIKE %s  # Use LIKE for username
                    ORDER BY CASE 
                        WHEN %s = 'size' THEN file_size 
                        ELSE created_at
                    END
                    LIMIT %s OFFSET %s
                """
            offset = (page - 1) * per_page
            username_pattern = f"%{username}%"
            cursor.execute(select_files_query, (username_pattern, sort, per_page, offset))

        public_files = cursor.fetchall()

        if public_files:
            return jsonify({"success": True, "data": public_files})
        else:
            return jsonify({"success": False, "error": "No public files found"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()
        conn.close()
@app.route('/api/search-public-files', methods=['GET'])
def get_search_public_files():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    try:
        searchQuery = request.args.get('searchQuery', default='', type=str)

        select_files_query = """
        SELECT file_name FROM public
        WHERE file_name LIKE %s
        """
        cursor.execute(select_files_query, ("%" + searchQuery + "%",))
        public_files = cursor.fetchall()

        if public_files:
            file_names = [file[0] for file in public_files]
            return jsonify({"success": True, "data": file_names})
        else:
            return jsonify({"success": False, "error": "No public files found"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()

@app.route('/api/recommendations/', methods=['GET'])
def generate_recommendations():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')

    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.DecodeError:
        return jsonify({'message': 'Token is invalid'}), 401

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    cursor.execute('SELECT file_id FROM history_download WHERE username = %s', (username,))
    download_history = [row[0] for row in cursor.fetchall()]
    app.logger.debug("download_history:" + download_history)
    if not download_history:
        cursor.close()
        conn.close()
        return jsonify({'message': 'No download history found for the user.'}), 404

    input_prompt = "Generate recommendations based on user's download history: " + ', '.join(download_history)

    clf = RandomForestClassifier()
    X_train, y_train = [], []
    clf.fit(X_train, y_train)
    app.logger.debug(X_train)
    user_history = []
    recommendations = clf.predict([user_history])[0]

    cursor.execute('SELECT file_id FROM public WHERE file_id IN %s', (tuple(recommendations),))
    recommended_files = [row[0] for row in cursor.fetchall()]

    cursor.close()
    conn.close()

    return jsonify({'username': username, 'recommendations': recommended_files})


# @app.route('/api/public-files', methods=['GET'])
# def get_public_files():
#     conn = mysql.connector.connect(**db_config)
#     cursor = conn.cursor()
#
#     try:
#         select_files_query = """
#             SELECT * FROM public
#         """
#         cursor.execute(select_files_query)
#         public_files = cursor.fetchall()
#
#         if public_files:
#             return jsonify({"success": True, "data": public_files})
#         else:
#             return jsonify({"success": False, "error": "No public files found"})
#
#     except Exception as e:
#         return jsonify({"success": False, "error": str(e)})
#
#     finally:
#         cursor.close()

@app.route('/api/fileDetails', methods=['GET'])
def get_file_details():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    app.logger.debug(f"token: {token}")
    file_id = request.args.get('fileId')
    username = decoded_token.get('username')
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

# @app.route('/api/fileDetails', methods=['GET'])
# def get_check_file_details():
#     token = request.headers.get('Authorization', '').replace('Bearer ', '')
#     app.logger.debug(f"token: {token}")
#     file_id = request.args.get('fileId')
#     username = request.args.get('username')
#
#     if not file_id:
#         return jsonify({"success": False, "error": "File ID is required"})
#
#     cursor = db.cursor()
#
#     try:
#         select_file_query = """
#             SELECT is_public FROM {}_files
#             WHERE file_id = %s
#         """.format(username)
#         cursor.execute(select_file_query, (file_id,))
#         file_details = cursor.fetchone()
#
#         if file_details:
#             return jsonify({"success": True, "data": file_details})
#         else:
#             return jsonify({"success": False, "error": "File details not found"})
#
#     except Exception as e:
#         return jsonify({"success": False, "error": str(e)})
#
#     finally:
#         cursor.close()

# @app.route('/api/upload', methods=['POST'])
# def upload_file():
#     if 'file' not in request.files:
#         return jsonify({'success': False, 'error': 'No file provided'}), 400
#
#     file = request.files['file']
#
#     if file.filename == '':
#         return jsonify({'success': False, 'error': 'No selected file'}), 400
#
#     try:
#         # Securely get the filename
#         filename = secure_filename(file.filename)
#
#         # Define the file path where the file will be temporarily saved on the server
#         file_path = os.path.join(UPLOAD_FOLDER, filename)
#
#         # Save the file to the specified file path temporarily
#         file.save(file_path)
#
#         # Check for viruses using ClamAV with pyclamd
#         cd = pyclamd.ClamdUnixSocket()
#         app.logger.debug(file_path)
#         scan_result = cd.scan_stream(open(file_path, 'rb'))
#
#         if scan_result['stream'] == 'OK':
#             # Virus scan passed, continue with file saving and database operations
#
#             # Generate a unique file_id
#             file_id = str(uuid.uuid4())
#
#             # Create a connection to the MySQL database
#             connection = mysql.connector.connect(**db_config)
#             cursor = connection.cursor()
#
#             # Get other data you need (username, etc.) from the request
#             username = request.form['username']
#
#             # Define the table name dynamically
#             table = f"{username}_files"
#
#             # Define the SQL query for inserting data into the dynamic table
#             insert_query = f"""
#                 INSERT INTO {table} (file_id, file_name, file_size, username, file_path)
#                 VALUES (%s, %s, %s, %s, %s)
#             """
#
#             # Get the file size
#             file_size = os.path.getsize(file_path)
#
#             # Execute the SQL query with the file_path
#             cursor.execute(insert_query, (file_id, filename, file_size, username, file_path))
#
#             # Commit the changes to the database
#             connection.commit()
#
#             # Close the cursor and database connection
#             cursor.close()
#             connection.close()
#
#             return jsonify({'success': True, 'message': 'File uploaded and data inserted successfully'}), 200
#
#         else:
#             # Virus scan failed, delete the infected file
#             os.remove(file_path)
#             return jsonify({'success': False, 'error': f'File is infected: {scan_result["stream"]}'})
#
#     except mysql.connector.Error as err:
#         return jsonify({'success': False, 'error': str(err)}), 500
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')
        data = request.headers.get('description')
        app.logger.debug(username)
        folder_id = request.form.get('folderId')

        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        try:
            # scan_result = scan_with_clamwin(file_path)
            #
            # if scan_result['infected']:
            #     os.remove(file_path)
            #     return jsonify({'success': False, 'error': 'File is infected: ' + scan_result['result']}), 400

            # explicit_content_detected = scan_for_explicit_content(file_path)
            #
            # if explicit_content_detected:
            #     os.remove(file_path)
            #     return jsonify({'success': False, 'error': 'Explicit content detected'}), 400

            file_id = str(uuid.uuid4())
            connection = mysql.connector.connect(**db_config)
            cursor = connection.cursor()

            cursor.execute("SELECT user_id FROM users WHERE username = %s", (username,))
            user_id = cursor.fetchone()[0]

            if folder_id == '':
                table = f"{username}_files"
                insert_query = f"""
                   INSERT INTO `{table}` (file_id, file_name, file_size, username, file_path, user_id)
                   VALUES (%s, %s, %s, %s, %s, %s)
                """
                file_size = os.path.getsize(file_path)
                cursor.execute(insert_query, (file_id, filename, file_size, username, file_path, user_id))
            else:
                table = f"{username}_files"
                insert_query = f"""
                   INSERT INTO `{table}` (file_id, file_name, folder_id, file_size, username, file_path, user_id)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                file_size = os.path.getsize(file_path)
                cursor.execute(insert_query, (file_id, filename, folder_id, file_size, username, file_path, user_id))

            connection.commit()

            cursor.close()
            connection.close()

            return jsonify({'success': True, 'message': 'File uploaded and data inserted successfully'}), 200
        except Exception as e:
            app.logger.error(f"An error occurred: {str(e)}")
            return jsonify({'success': False, 'error': 'File upload failed'}), 500
    except jwt.ExpiredSignatureError:
        return jsonify({'success': False, 'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'success': False, 'error': 'Invalid token'}), 401

# def scan_with_clamwin(file_path):
#     clamscan_exe = 'C:/ClamWin/bin/clamscan.exe'
#     database_path = 'C:/ClamWin/bin/db'
#
#     if not os.path.isfile(clamscan_exe):
#         raise Exception(f"The clamscan executable does not exist: {clamscan_exe}")
#     if not os.path.isdir(database_path):
#         raise Exception(f"The database directory does not exist: {database_path}")
#     command = [clamscan_exe, '--database=' + database_path, file_path]
#
#     try:
#         result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
#         if "FOUND" in result.stdout:
#             return {"infected": True, "result": result.stdout}
#         elif "OK" in result.stdout:
#             return {"infected": False, "result": result.stdout}
#         else:
#             raise Exception(f"Error scanning file: {result.stderr}")
#     except subprocess.CalledProcessError as e:
#         raise Exception(f"ClamWin scan failed: {e.stderr}")

# def scan_for_explicit_content(file_path):
#     if file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
#
#         image_client = vision_v1.ImageAnnotatorClient()
#
#         # Read the image file
#         with open(file_path, 'rb') as image_file:
#             content = image_file.read()
#
#         # Create an image object
#         image = vision_v1.Image(content=content)
#
#         # Perform safe search detection
#         response = image_client.safe_search_detection(image=image)
#         annotations = response.safe_search_annotation
#
#         # Convert annotations to JSON format
#         explicit_annotations = MessageToJson(annotations)
#
#         # Check for explicit content
#         if "LIKELY" in explicit_annotations or "VERY_LIKELY" in explicit_annotations:
#             return True  # Explicit content detected
#         else:
#             return False  # No explicit content detected
#
#     # Unsupported file format
#     return False

@app.route('/api/like-dislike/<file_id>', methods=['POST'])
def like_dislike(file_id):
    try:
        data = request.get_json()
        like_dislike = data.get('like_dislike')

        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')
        app.logger.debug(username)
        table = "user_likes"
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute("SELECT action FROM {} WHERE file_id = %s AND username = %s".format(table), (file_id, username))
        existing_action = cursor.fetchone()

        if existing_action:
            return jsonify({'message': f'You have already {existing_action[0]}d the file'}), 400


        cursor.execute("INSERT INTO {} (file_id, username, action) VALUES (%s, %s, %s)".format(table), (file_id, username, like_dislike))
        conn.commit()


        cursor.close()
        conn.close()

        return jsonify({'message': f'Successfully {like_dislike}d the file'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/admin/remove-file/<string:username>/<string:file_id>', methods=['DELETE'])
def remove_file_admin(username, file_id):
    try:

        cursor = db.cursor()


        select_query = "SELECT file_path FROM {} WHERE username=%s AND file_id=%s".format(username + "_files")
        cursor.execute(select_query, (username, file_id))
        file_path = cursor.fetchone()

        if file_path:
            file_path = file_path[0]

            delete_query = "DELETE FROM {} WHERE username=%s AND file_id=%s".format(username + "_files")
            cursor.execute(delete_query, (username, file_id))

            db.commit()

            cursor.close()
            db.close()

            import os
            if os.path.exists(file_path):
                os.remove(file_path)

            return jsonify(success=True, message="File removed successfully")
        else:
            return jsonify(success=False, message="File not found")

    except Exception as e:
        return jsonify(success=False, error=str(e))
@app.route('/api/remove-file/<file_id>', methods=['DELETE'])
def remove_file(file_id):
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')

        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        table = f"{username}_files"
        delete_query = f"DELETE FROM `{table}` WHERE file_id = %s"
        cursor.execute(delete_query, (file_id,))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'success': True, 'message': 'File removed successfully'}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'success': False, 'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'success': False, 'error': 'Invalid token'}), 401
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        return jsonify({'success': False, 'error': 'File removal failed'}), 500

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
        user_id = request.form.get('user_id')
        app.logger.debug(user_id)
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
        user_id = request.form.get('user_id')
        insert_folder_query = """
            INSERT INTO {} (folder_id, username, folder_name, folder_path, parent_folder_id, parent_folder_name, user_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """.format(table)

        folder_id = str(uuid.uuid4())

        parent_folder_id = parent_folder_id if parent_folder_id else None
        parent_folder_name = parent_folder_name if parent_folder_name else None

        cursor.execute(insert_folder_query, (folder_id, username, folder_name, folder_path, parent_folder_id, parent_folder_name, user_id))
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
    user_id = request.form.get('user_id')
    table = f"{username}_files"
    cursor.execute("""
        INSERT INTO {} (file_id, file_name, folder_id, file_size, username, file_path, user_id)
        VALUES (%s, %s, %s, %s, %s, %s , %s)
    """.format(table), (file_id, file_name, folder_id, file_size, username, file_path, user_id))

    db.commit()
    cursor.close()

@app.route('/api/create-folder', methods=['POST'])
def create_folder1():
    try:

        token = request.headers.get('Authorization', '').replace('Bearer ', '')


        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = decoded_token.get('username')
        user_id = decoded_token.get('user_id')

        data = request.get_json()
        folder_name = data.get('folderName')
        parent_folder_id = data.get('parentFolderId')

        if not folder_name:
            return jsonify({'success': False, 'error': 'Folder name not provided'}), 400

        if parent_folder_id:
            parent_folder_path = get_folder_path(parent_folder_id, username)
            if not parent_folder_path:
                return jsonify({"error": "Parent folder not found"}), 404

            folder_path = os.path.join(parent_folder_path, folder_name)

        else:

            folder_path = os.path.join(app.config['UPLOAD_FOLDER'], username, 'uploads', folder_name)


        if os.path.exists(folder_path):
            return jsonify({'success': False, 'error': 'Folder already exists'}), 400

        os.makedirs(folder_path)

        cursor = db.cursor(dictionary=True)
        try:
            table = f"{username}_folders"
            insert_folder_query = """
                INSERT INTO {} (folder_id, folder_name, folder_path, username, parent_folder_id, parent_folder_name, user_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """.format(table)

            folder_id = str(uuid.uuid4())
            parent_folder_name = None

            cursor.execute(insert_folder_query, (folder_id, folder_name, folder_path, username, parent_folder_id, parent_folder_name, user_id))
            db.commit()
        finally:
            cursor.close()

        return jsonify({'success': True, 'message': 'Folder created successfully'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'success': False, 'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'success': False, 'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/download/<file_id>', methods=['GET'])
def download_file(file_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = request.headers.get('Username')
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
        app.logger.debug(file_data)
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

@app.route('/api/notifications/<username>', methods=['GET'])
def get_notifications(username):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])

    try:
        app.logger.debug("meno", username)
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        table = f"{username}_notifications"

        cursor.execute("SELECT * FROM {}".format(table))
        notifications = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({"success": True, "notifications": notifications})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
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
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        select_username_query = "SELECT username FROM public WHERE file_id = %s"
        cursor.execute(select_username_query, (file_id,))
        result = cursor.fetchone()
        app.logger.debug(result)
        if result:
            username = result['username']

            select_comments_query = f"SELECT * FROM {username}_comments WHERE file_id = %s"
            cursor.execute(select_comments_query, (file_id,))
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
        else:
            return jsonify({'success': False, 'error': 'Username not found for file_id'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/like-dislike-count/<file_id>', methods=['GET'])
def get_like_dislike_count(file_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute("SELECT username FROM users")
        usernames = [row[0] for row in cursor.fetchall()]

        total_like_count = 0
        total_dislike_count = 0

        for username in usernames:
            table = f"{username}_likes"
            cursor.execute("SELECT COUNT(*) FROM {} WHERE LOWER(file_id) = %s AND action = 'like'".format(table), (file_id.lower(),))
            like_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM {} WHERE LOWER(file_id) = %s AND action = 'dislike'".format(table), (file_id.lower(),))
            dislike_count = cursor.fetchone()[0]


            total_like_count += like_count
            total_dislike_count += dislike_count
            app.logger.debug(total_like_count)

        conn.close()

        return jsonify({'total_like_count': total_like_count, 'total_dislike_count': total_dislike_count}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/comments-private/<file_id>', methods=['GET'])
def get_comments_by_file_id_private(file_id):
    conn = mysql.connector.connect(**db_config)
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    username = decoded_token.get('username')
    app.logger.debug(f"username in comments: {token}")
    table = f"{username}_comments"
    app.logger.debug(table)
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

@app.route('/api/comments-public/<file_id>', methods=['POST'])
def post_comment_pulbic(file_id):
    data = request.get_json()
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = decoded_token.get('user_id')
        username1 = decoded_token.get('username')
        usernametoken = decoded_token.get('usernametoken')
        app.logger.debug("logged in", usernametoken)
        username_writer = decoded_token.get('username')
        select_username_query = "SELECT username FROM public WHERE file_id = %s"
        cursor.execute(select_username_query, (file_id,))
        result = cursor.fetchone()
        app.logger.debug(result)
        username = result['username']
        app.logger.debug(f"username in comments: {username}")
        table = f"{username}_comments"

        comment_text = data.get('commentText')
        username_text = data.get('usernametoken')

        insert_query = "INSERT INTO {} (file_id, user_id, username, comment_text, target_username) VALUES (%s, %s, %s, %s, %s)".format(table)
        cursor.execute(insert_query, (file_id, user_id, username_writer, comment_text, username1))
        conn.commit()

        return jsonify({'success': True, 'message': 'Comment added successfully'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()
@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    try:
        data = request.get_json()
        subscriber_username = data.get('subscriberUsername')
        target_username = data.get('targetUsername')

        if not subscriber_username or not target_username:
            return jsonify({"success": False, "error": "Invalid data"}), 400

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
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

    finally:
        cursor.close()

@app.route('/api/check-subscription', methods=['POST'])
def check_subscription():
    data = request.get_json()
    subscriber_username = data.get('subscriberUsername')
    target_username = data.get('targetUsername')

    app.logger.debug(f"Received subscriber_username: {subscriber_username}, target_username: {target_username}")

    if not subscriber_username or not target_username:
        return jsonify({"success": False, "error": "Invalid data"}), 400

    try:

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
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
    target_username = data.get('targetUsername')
    message = data.get('message')
    app.logger.debug(f"Received subscriber_username: {target_username}, target_username: {message}")

    if not target_username or not message:
        return jsonify({"success": False, "error": "Invalid data"}), 400

    cursor.execute("SELECT user_id FROM users WHERE username = %s", (target_username,))
    subscriber_user = cursor.fetchone()

    if not subscriber_user:
        return jsonify({"success": False, "error": "Invalid usernames"}), 400

    user_id = subscriber_user['user_id']
    notification_id = str(uuid.uuid4())

    table = f"{target_username}_notifications"
    cursor.execute(
        "INSERT INTO {}(user_id, message, username) VALUES (%s, %s, %s)".format(table),
        (user_id, message, target_username)
    )
    db.commit()

    return jsonify({"success": True, "notification_id": notification_id})

# @app.route('/api/count-subscribers', methods=['GET', 'OPTIONS'])  # Allow both GET and OPTIONS requests
# def count_subscribers():
#     if request.method == 'OPTIONS':
#         headers = {
#             'Access-Control-Allow-Origin': '*',
#             'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
#             'Access-Control-Allow-Headers': 'Content-Type, Authorization',
#         }
#         return make_response('', 200, headers)
#     elif request.method == 'GET':
#         token = request.headers.get('Authorization', '').replace('Bearer ', '')
#
#         try:
#             conn = mysql.connector.connect(**db_config)
#             cursor = conn.cursor()
#             decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
#             username = decoded_token.get('username')
#             target_username = request.args.get('targetUsername')
#             app.logger.debug('aksdmsakdnsajdnasidniasjdnasijdnasij')
#             conn = mysql.connector.connect(**db_config)
#             cursor = conn.cursor()
#             cursor.execute("SELECT COUNT(subscription_id) FROM subscribe WHERE target_user_id = (SELECT user_id FROM users WHERE username = %s)", (username,))
#             result = cursor.fetchone()
#             app.logger.debug(result)
#             cursor.close()
#
#             if result is not None:
#                 subscriber_count = result['subscriber_count']
#                 return jsonify({'subscriber_count': subscriber_count})
#             else:
#                 return jsonify({'error': 'User not found'}), 404
#
#         except Exception as e:
#             return jsonify({'error': str(e)}), 500

@app.route('/api/counts', methods=['OPTIONS', 'GET'])
def count_subscribers():
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
            target_username = request.args.get('targetUsername')
            app.logger.debug('use',  target_username)
            table_name = f"{target_username}_comments"

            cursor.execute("SELECT COUNT(subscription_id) FROM subscribe WHERE target_user_id = (SELECT user_id FROM users WHERE username = %s)", (target_username,))

            subscriber_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(comment_id) FROM {} WHERE username = %s".format(table_name), (target_username,))

            comment_count = cursor.fetchone()[0]

            cursor.execute("SELECT username FROM users")
            usernames = [row[0] for row in cursor.fetchall()]
            total_comment_count = 0

            for user in usernames:
                comments_table = f"{user}_comments"
                cursor.execute("SELECT COUNT(comment_id) FROM {} WHERE target_username = %s".format(comments_table), (target_username,))
                user_comment_count = cursor.fetchone()[0]
                total_comment_count += user_comment_count



            cursor.close()

            response_data = {'subscriberCount': subscriber_count, 'commentCount': comment_count, 'commentGetCount': total_comment_count}
            return jsonify(response_data)

        finally:
            if cursor:
                cursor.close()
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
















#     elif file_path.lower().endswith(('.mp4', '.avi', '.mkv', '.mov')):
#     with open(file_path, 'rb') as video_file:
#         input_content = video_file.read()
#     input_uri = 'path/to/video.mp4'
#     features = [videointelligence.Feature.EXPLICIT_CONTENT_DETECTION]
#     video_context = videointelligence.VideoContext(explicit_content_detection_config=videointelligence.ExplicitContentDetectionConfig())
#     operation = video_client.annotate_video(
#         request={"input_uri": input_uri, "features": features, "video_context": video_context}
#     )
#     result = operation.result()
#     annotations = result.annotation_results[0].explicit_annotation
# else:
# return False
#
# explicit_annotations = MessageToJson(annotations)
# return "LIKELY" in explicit_annotations or "VERY_LIKELY" in explicit_annotations
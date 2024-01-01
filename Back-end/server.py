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
<<<<<<< HEAD

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': '7',
}

db = mysql.connector.connect(**db_config)

cursor = db.cursor(dictionary=True)

app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'petouploads')

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', "pptx", "rar", "zip"}




def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/login', methods=['POST'])
def user_login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    if user and user['password'] == password:
        session_id = str(uuid.uuid4())

        token_payload = {'username': username, 'session_id': session_id}
        token = jwt.encode(token_payload, algorithm='HS256')

        response = {'success': True, 'token': token, 'session_id': session_id, 'message': 'Login successful', 'user_id': user['user_id'],}

        response['username'] = username

        return jsonify(response)
    else:
        return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

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
            decoded_token = jwt.decode(token, algorithms=['HS256'])
            username = decoded_token.get('username')
            user_info = {'username': username, 'email': 'example@email.com'}

            return jsonify(user_info)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

@app.route('/api/user-info/<username>', methods=['GET'])
def get_user_info_profile(username):
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    if user:
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
    folder_id = request.args.get('folder_id')

    if folder_id:
        folders, files = get_files_and_folders_by_folder_id(folder_id)
    else:
        folders, files = get_top_level_files_and_folders()

    response = {
        "success": True,
        "data": {
            "folders": folders,
            "files": files
        }
    }

    return jsonify(response)

def get_files_and_folders_by_folder_id(folder_id):
    cursor = db.cursor(dictionary=True)

    try:
        select_folders_query = """
            SELECT * FROM folders
            WHERE parent_folder_id = %s
        """
        cursor.execute(select_folders_query, (folder_id,))
        folders = cursor.fetchall()

        select_files_query = """
            SELECT * FROM file
            WHERE folder_id = %s
        """
        cursor.execute(select_files_query, (folder_id,))
        files = cursor.fetchall()

    finally:
        cursor.close()

    return folders, files

def get_top_level_files_and_folders():
    cursor = db.cursor(dictionary=True)

    try:
        select_top_level_folders_query = """
            SELECT * FROM folders
            WHERE parent_folder_id IS NULL
        """
        cursor.execute(select_top_level_folders_query)
        folders = cursor.fetchall()

        select_top_level_files_query = """
            SELECT * FROM file
            WHERE folder_id IS NULL
        """
        cursor.execute(select_top_level_files_query)
        files = cursor.fetchall()

    finally:
        cursor.close()

    return folders, files



@app.route('/api/public-files', methods=['GET'])
def get_public_files():
    cursor = db.cursor()

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
    file_id = request.args.get('fileId')

    if not file_id:
        return jsonify({"success": False, "error": "File ID is required"})

    cursor = db.cursor()

    try:
        select_file_query = """
            SELECT * FROM file
            WHERE file_id = %s
        """
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
    file_id = request.args.get('fileId')

    if not file_id:
        return jsonify({"success": False, "error": "File ID is required"})

    cursor = db.cursor()

    try:
        select_file_query = """
            SELECT is_public FROM file
            WHERE file_id = %s
        """
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
        select_folder_query = """
            SELECT * FROM folders
            WHERE folder_name = %s AND username = %s AND parent_folder_id = %s
        """
        cursor.execute(select_folder_query, (folder_name, username, parent_folder_id))
        result = cursor.fetchone()
        if result:
            return jsonify({"error": "Folder already exists in the database"}), 400

        insert_folder_query = """
            INSERT INTO folders (folder_id, username, folder_name, folder_path, parent_folder_id, parent_folder_name)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
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
        select_folder_query = """
            SELECT folder_path FROM folders
            WHERE folder_id = %s AND username = %s
        """
        cursor.execute(select_folder_query, (folder_id, username))
        result = cursor.fetchone()
        return result['folder_path'] if result else None
    finally:
        cursor.close()

def create_file(file_name, folder_id, username, file_path):
    cursor = db.cursor()
    file_size = os.path.getsize(file_path)
    file_id = str(uuid.uuid4())

    cursor.execute("""
        INSERT INTO file (file_id, file_name, folder_id, file_size, username, file_path)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (file_id, file_name, folder_id, file_size, username, file_path))

    db.commit()
    cursor.close()

# @app.route('/api/download/<filename>', methods=['GET'])
# def download_file(filename):
#     file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#
#     if os.path.exists(file_path):
#         return send_file(file_path, as_attachment=True)
#     else:
#         return jsonify({'success': False, 'error': 'File not found'}), 404


@app.route('/api/make-public/<file_id>', methods=['POST'])
def make_file_public(file_id):
    cursor.execute("SELECT * FROM file WHERE file_id = %s", (file_id,))
    file_data = cursor.fetchone()

    if not file_data:
        return jsonify({'success': False, 'error': 'File not found'}), 404

    cursor.execute("SELECT * FROM public WHERE file_id = %s", (file_id,))
    public_file_data = cursor.fetchone()

    if public_file_data:
        return jsonify({'success': False, 'error': 'File is already public'}), 400

    cursor.execute(
        "INSERT INTO public (file_id, file_name, folder_id, file_size, username, file_path) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        (
            file_id,
            file_data['file_name'],
            file_data['folder_id'],
            file_data['file_size'],
            file_data['username'],
            file_data['file_path'],
        )
    )

    cursor.execute("UPDATE file SET is_public = 1 WHERE file_id = %s", (file_id,))

    db.commit()

    return jsonify({'success': True, 'message': 'File is now public'})


@app.route('/api/make-private/<file_id>', methods=['POST'])
def make_file_private(file_id):
    cursor = db.cursor()

    try:
        cursor.execute("SELECT * FROM file WHERE file_id = %s", (file_id,))
        file_data = cursor.fetchone()

        if not file_data:
            return jsonify({'success': False, 'error': 'File not found'}), 404

        cursor.execute("UPDATE file SET is_public = 0 WHERE file_id = %s", (file_id,))

        cursor.execute("DELETE FROM public WHERE file_id = %s", (file_id,))

        db.commit()

        return jsonify({'success': True, 'message': 'File is now private'})

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
    BASE_FOLDER = 'petouploads'
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

@app.route('/api/files/<int:file_id>', methods=['GET'])
def get_file_by_id(file_id):
    cursor.execute("SELECT * FROM files WHERE file_id = %s", (file_id,))
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
    cursor.execute("SELECT * FROM comments WHERE file_id = %s", (file_id,))
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

@app.route('/api/comments/<file_id>', methods=['POST'])
def post_comment(file_id):
    data = request.get_json()

    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    decoded_token = jwt.decode(token, algorithms=['HS256'])
    user_id = decoded_token.get('user_id')
    username = decoded_token.get('username', '')

    comment_text = data.get('commentText')

    cursor.execute(
        "INSERT INTO comments (file_id, user_id, username, comment_text) VALUES (%s, %s, %s, %s)",
        (file_id, user_id, username, comment_text)
    )
    db.commit()

    return jsonify({'success': True, 'message': 'Comment added successfully'})

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

    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT user_id FROM users WHERE username = %s", (subscriber_username,))
    subscriber_user = cursor.fetchone()

    if not subscriber_user:
        return jsonify({"success": False, "error": "Invalid usernames"}), 400
    user_id = subscriber_user['user_id']
    notification_id = str(uuid.uuid4())



    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "INSERT INTO notifications (user_id, message, username) VALUES (%s, %s, %s)",
        (user_id, message, subscriber_username)
    )
    db.commit()

    return jsonify({"success": True, "notification_id": notification_id})

@app.route('/api/check-notification', methods=['GET'])
def check_notifications():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        decoded_token = jwt.decode(token, algorithms=['HS256'])
        username = decoded_token.get('username')
        app.logger.debug(f"Received subscriber_username: {username}")

        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM notifications WHERE username = %s AND is_read = 0", (username,))
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
        username = data.get('username')
        new_tier = data.get('tier')
        app.logger.debug(f"Received subscriber_username: {username}, target_username: {new_tier}")
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        decoded_token = jwt.decode(token, algorithms=['HS256'])
        if decoded_token.get('username') != username:
            return jsonify({'error': 'Invalid token'}), 401

        cursor = db.cursor(dictionary=True)
        cursor.execute("UPDATE users SET tier = %s WHERE username = %s", (new_tier, username))
        db.commit()

        return jsonify({'message': 'Tier updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

=======

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': '7',
}

db = mysql.connector.connect(**db_config)

cursor = db.cursor(dictionary=True)

SECRET_KEY = 'your_secret_key'
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'petouploads')

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', "pptx", "rar", "zip"}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/login', methods=['POST'])
def user_login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    if user and user['password'] == password:
        session_id = str(uuid.uuid4())

        token_payload = {'username': username, 'session_id': session_id}
        token = jwt.encode(token_payload, SECRET_KEY, algorithm='HS256')

        response = {'success': True, 'token': token, 'session_id': session_id, 'message': 'Login successful'}

        response['username'] = username

        return jsonify(response)
    else:
        return jsonify({'success': False, 'error': 'Invalid username or password'}), 401
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
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            username = decoded_token.get('username')
            user_info = {'username': username, 'email': 'example@email.com'}

            return jsonify(user_info)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401




@app.route('/api/files', methods=['GET'])
def get_files_and_folders():
    folder_id = request.args.get('folder_id')

    if folder_id:

        folders, files = get_files_and_folders_by_folder_id(folder_id)
    else:

        folders, files = get_top_level_files_and_folders()


    return jsonify({"success": True, "folders": folders, "files": files})


def get_files_and_folders_by_folder_id(folder_id):
    cursor = db.cursor(dictionary=True)

    try:
        select_folders_query = """
            SELECT * FROM folders
            WHERE parent_folder_id = %s
        """
        cursor.execute(select_folders_query, (folder_id,))
        folders = cursor.fetchall()

        select_files_query = """
            SELECT * FROM file
            WHERE folder_id = %s
        """
        cursor.execute(select_files_query, (folder_id,))
        files = cursor.fetchall()

    finally:
        cursor.close()

    return folders, files

def get_top_level_files_and_folders():
    cursor = db.cursor(dictionary=True)

    try:
        select_top_level_folders_query = """
            SELECT * FROM folders
            WHERE parent_folder_id IS NULL
        """
        cursor.execute(select_top_level_folders_query)
        folders = cursor.fetchall()

        select_top_level_files_query = """
            SELECT * FROM file
            WHERE folder_id IS NULL
        """
        cursor.execute(select_top_level_files_query)
        files = cursor.fetchall()

    finally:
        cursor.close()

    return folders, files






@app.route('/api/upload1', methods=['POST'])
def upload_files_and_folders():
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

    # Check if folder already exists in the file system
    if os.path.exists(folder_path):
        return jsonify({"error": "Folder already exists"}), 400

    cursor = db.cursor(dictionary=True)

    try:
        select_folder_query = """
            SELECT * FROM folders
            WHERE folder_name = %s AND username = %s AND parent_folder_id = %s
        """
        cursor.execute(select_folder_query, (folder_name, username, parent_folder_id))
        result = cursor.fetchone()
        if result:
            return jsonify({"error": "Folder already exists in the database"}), 400

        insert_folder_query = """
            INSERT INTO folders (folder_id, username, folder_name, folder_path, parent_folder_id, parent_folder_name)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
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
        select_folder_query = """
            SELECT folder_path FROM folders
            WHERE folder_id = %s AND username = %s
        """
        cursor.execute(select_folder_query, (folder_id, username))
        result = cursor.fetchone()
        return result['folder_path'] if result else None
    finally:
        cursor.close()

def create_file(file_name, folder_id, username, file_path):
    cursor = db.cursor()
    file_size = os.path.getsize(file_path)
    file_id = str(uuid.uuid4())

    cursor.execute("""
        INSERT INTO file (file_id, file_name, folder_id, file_size, username, file_path)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (file_id, file_name, folder_id, file_size, username, file_path))

    db.commit()
    cursor.close()

# @app.route('/api/download/<filename>', methods=['GET'])
# def download_file(filename):
#     file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#
#     if os.path.exists(file_path):
#         return send_file(file_path, as_attachment=True)
#     else:
#         return jsonify({'success': False, 'error': 'File not found'}), 404





@app.route('/api/files/<path:folder>', methods=['GET'])
def get_folder_contents(folder):
    BASE_FOLDER = 'petouploads'
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
@app.route('/api/files/<int:file_id>', methods=['GET'])
def get_file_by_id(file_id):
    cursor.execute("SELECT * FROM files WHERE file_id = %s", (file_id,))
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

@app.route('/api/comments/<int:file_id>', methods=['GET'])
def get_comments_by_file_id(file_id):
    cursor.execute("SELECT * FROM comments WHERE file_id = %s", (file_id,))
    comments = cursor.fetchall()

    comment_list = [
        {
            'comment_id': comment['comment_id'],
            'user_id': comment['user_id'],
            'username': comment['username'],
            'comment_text': comment['comment_text'],
            'created_at': comment['created_at'].isoformat(),
        } for comment in comments
    ]

    return jsonify({'success': True, 'comments': comment_list})

@app.route('/api/comments/<int:file_id>', methods=['POST'])
def post_comment(file_id):
    data = request.get_json()

    # Fetch the 'user_id' and 'username' from the decoded JWT token
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    user_id = decoded_token.get('user_id')
    username = decoded_token.get('username', '')

    comment_text = data.get('commentText')

    cursor.execute(
        "INSERT INTO comments (file_id, user_id, username, comment_text) VALUES (%s, %s, %s, %s)",
        (file_id, user_id, username, comment_text)
    )
    db.commit()

    return jsonify({'success': True, 'message': 'Comment added successfully'})
>>>>>>> 3546cf8f1c90c75ffa6d0ee4f8baacbf45e4d0b6

if __name__ == '__main__':
    app.run(debug=True)
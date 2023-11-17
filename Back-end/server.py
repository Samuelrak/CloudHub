from io import BytesIO

import mysql.connector
from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
import jwt
import uuid


app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': '6',
}

db = mysql.connector.connect(**db_config)

cursor = db.cursor(dictionary=True)

SECRET_KEY = 'your_secret_key'

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

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
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        file_data = file.read()

        user_id = request.form.get('user_id')
        username = request.form.get('username')
        file_id = request.form.get('file_id')

        file_size = len(file_data)

        cursor.execute(
            "INSERT INTO files (user_id, username, filename, file_data, file_size) VALUES (%s, %s, %s, %s, %s)",
            (user_id, username, file.filename, file_data, file_size)
        )
        db.commit()

        return jsonify({'success': True, 'message': 'File uploaded to database successfully'})

    return jsonify({'success': False, 'error': 'Invalid file type'}), 400


@app.route('/api/files', methods=['GET'])
def get_files():
    cursor.execute("SELECT filename, user_id, username, created_at, file_size, file_id FROM files")
    files = cursor.fetchall()

    file_list = [
        {
            'filename': file['filename'],
            'file_id' : file['file_id'],
            'user_id': file['user_id'],
            'username': file['username'],
            'created_at': file['created_at'].isoformat(),
            'file_size': file['file_size']
        } for file in files
    ]

    return jsonify({'success': True, 'files': file_list})

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    cursor.execute("SELECT file_data FROM files WHERE filename = %s", (filename,))
    file_data = cursor.fetchone()

    if file_data:
        file_data = file_data['file_data']
        file_object = BytesIO(file_data)
        return send_file(file_object, as_attachment=True, download_name=filename)

    return jsonify({'success': False, 'error': 'File not found'}), 404

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


if __name__ == '__main__':
    app.run(debug=True)
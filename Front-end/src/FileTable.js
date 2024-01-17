import React from 'react';

const FileTable = ({ files, handleFileClick }) => {
  return (
    <table className="file-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Názov</th>
          <th>Typ</th>
          <th>Veľkosť</th>
          <th>Užívateľ</th>
          <th>Vytvorené</th>
          <th>Akcia</th>
        </tr>
      </thead>
      <tbody>
        {files.map((file, index) => (
          <tr key={file.file_id}>
            <td>{index + 1}</td>
            <td>{file.file_name}</td>
            <td>{file.file_type}</td>
            <td>{file.file_size} bytes</td>
            <td>{file.username}</td>
            <td>{file.created_at}</td>
            <td>
              <button onClick={(event) => handleFileClick(file, event)}>Detail</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FileTable;

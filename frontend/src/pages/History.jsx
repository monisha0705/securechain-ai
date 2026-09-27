import { useEffect, useState } from "react";

const History = () => {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/v1/scans")
      .then((res) => res.json())
      .then((data) => setScans(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>Scan History</h2>

      {scans.length === 0 ? (
        <p>No scans found</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>File</th>
              <th>Packages</th>
              <th>Vulnerabilities</th>
              <th>Risk Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => (
              <tr key={scan.scan_id}>
                <td>{scan.filename}</td>
                <td>{scan.total_packages}</td>
                <td>{scan.total_vulnerabilities}</td>
                <td>{scan.risk_score.toFixed(2)}</td>
                <td>{scan.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default History;
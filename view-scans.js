document.addEventListener("DOMContentLoaded", function() {
    fetch("http://localhost:3000/get-scans")
        .then(res => res.json())
        .then(scans => {
            const tbody = document.getElementById("scansTable").querySelector("tbody");
            if (!scans.length) {
                tbody.innerHTML = "<tr><td colspan='5'>No scans found.</td></tr>";
                return;
            }
            tbody.innerHTML = scans.map(scan => `
                <tr>
                    <td>${scan.name || ""}</td>
                    <td>${scan.contractNumber || ""}</td>
                    <td>${scan.status || ""}</td>
                    <td>${scan.issues ? scan.issues.length : 0}</td>
                    <td>${scan.contractNumber ? new Date(parseInt(scan.contractNumber.split('-')[1])).toLocaleString() : ""}</td>
                </tr>
            `).join("");
        })
        .catch(err => {
            document.getElementById("scansTable").querySelector("tbody").innerHTML =
                `<tr><td colspan='5'>Error loading scans: ${err.message}</td></tr>`;
        });
});
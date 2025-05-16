// Enable scan button when a PDF is selected

document.addEventListener("DOMContentLoaded", function() {
    const pdfInput = document.getElementById("pdfUpload");
    const btn = document.getElementById("processPdf");
    const status = document.getElementById("uploadStatus");

    pdfInput.addEventListener("change", function() {
        const file = this.files[0];
        if (file && file.type === "application/pdf") {
            btn.disabled = false;
            status.textContent = `Selected: ${file.name}`;
            status.className = "status-message success";
        } else {
            btn.disabled = true;
            status.textContent = "Please select a PDF file";
            status.className = "status-message error";
        }
    });

    btn.addEventListener("click", async function() {
        const file = pdfInput.files[0];
        if (!file) return;
        const pdfjsLib = window['pdfjsLib'];
        if (!pdfjsLib || !pdfjsLib.getDocument) {
            status.textContent = "PDF.js library not loaded. Please refresh the page.";
            status.className = "status-message error";
            return;
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('libs/pdf.worker.min.js');
        status.textContent = "Processing PDF...";
        status.className = "status-message processing";
        btn.disabled = true;

        const reader = new FileReader();
        reader.onload = async function () {
            try {
                const typedarray = new Uint8Array(reader.result);
                const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                let fullText = "";
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const content = await page.getTextContent();
                    const pageText = content.items.map(item => item.str).join(" ");
                    fullText += pageText + "\n";
                }
                // Only call processExtractedPdf, let it handle saving and opening results
                await processExtractedPdf(fullText, "pdf-results1.html");
            } catch (error) {
                status.textContent = "Error processing PDF file. Please try again.";
                status.className = "status-message error";
                btn.disabled = false;
            }
        };
        reader.onerror = function() {
            status.textContent = "Error reading file. Please try again.";
            status.className = "status-message error";
            btn.disabled = false;
        };
        reader.readAsArrayBuffer(file);
    });
}); 
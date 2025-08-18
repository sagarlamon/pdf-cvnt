const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const previewArea = document.getElementById('previewArea');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const convertBtn = document.getElementById('convertBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const downloadModal = document.getElementById('downloadModal');
const overlay = document.getElementById('overlay');
const downloadLink = document.getElementById('downloadLink');
const shareButton = document.getElementById('shareButton');

let uploadedImages = [];
let pdfBlob = null;

// Handle file selection via button click
imageInput.addEventListener('change', handleFiles);

// Handle Drag & Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    handleFiles({ target: { files: files } });
});

function handleFiles(event) {
    uploadedImages = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
    if (uploadedImages.length > 0) {
        imagePreviewContainer.innerHTML = '';
        uploadedImages.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = 'Image Preview';
                img.classList.add('image-preview');
                imagePreviewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
        
        previewArea.style.display = 'flex';
        previewArea.classList.add('animate-in');
        progressContainer.style.display = 'none';
        progressBar.style.width = '0';
        
        // Auto-scroll to the preview section
        previewArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        previewArea.style.display = 'none';
    }
}

convertBtn.addEventListener('click', async () => {
    if (uploadedImages.length === 0) {
        alert('Please upload one or more images first.');
        return;
    }

    progressContainer.style.display = 'block';
    progressBar.style.width = '0';

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    for (let i = 0; i < uploadedImages.length; i++) {
        const file = uploadedImages[i];
        const reader = new FileReader();
        reader.readAsDataURL(file);

        await new Promise((resolve) => {
            reader.onload = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                    const finalWidth = imgWidth * ratio;
                    const finalHeight = imgHeight * ratio;
                    const x = (pageWidth - finalWidth) / 2;
                    const y = (pageHeight - finalHeight) / 2;

                    if (i > 0) {
                        doc.addPage();
                    }
                    doc.addImage(reader.result, 'JPEG', x, y, finalWidth, finalHeight);

                    const progress = ((i + 1) / uploadedImages.length) * 100;
                    progressBar.style.width = `${progress}%`;
                    resolve();
                };
            };
        });
    }

    pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    downloadLink.href = pdfUrl;
    downloadLink.download = 'converted-images.pdf';

    showModal();
    
    setTimeout(() => {
        progressBar.style.width = '0';
        progressContainer.style.display = 'none';
    }, 500);
});

function showModal() {
    downloadModal.style.display = 'block';
    overlay.style.display = 'block';
}

function closeModal() {
    downloadModal.style.display = 'none';
    overlay.style.display = 'none';
    if (pdfBlob) {
        URL.revokeObjectURL(downloadLink.href);
        pdfBlob = null;
    }
}

window.addEventListener('click', (event) => {
    if (event.target === overlay) {
        closeModal();
    }
});

function sharePDF() {
    if (navigator.share && pdfBlob) {
        const filesArray = [new File([pdfBlob], 'converted-images.pdf', { type: 'application/pdf' })];
        if (navigator.canShare({ files: filesArray })) {
            navigator.share({
                files: filesArray,
                title: 'PDF from Images',
                text: 'Check out this PDF I created from my images!',
            })
            .then(() => console.log('Share was successful.'))
            .catch((error) => console.log('Sharing failed', error));
        } else {
            alert('Your browser does not support sharing files. Please download the file first.');
        }
    } else {
        alert('Sharing is not supported on this browser or device. Please download the file.');
    }
}
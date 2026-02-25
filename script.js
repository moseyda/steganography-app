document.addEventListener('DOMContentLoaded', function () {
    const mainContent = document.getElementById('mainContent');
    const ethicsModal = document.getElementById('ethicsModal');
    const agreeButton = document.getElementById('agreeButton');
    const disagreeButton = document.getElementById('disagreeButton');

    // Fade in animation
    setTimeout(() => {
        mainContent.style.opacity = '1';
    }, 100);

    agreeButton.addEventListener('click', function () {
        ethicsModal.style.display = 'none';
    });

    disagreeButton.addEventListener('click', function () {
        alert('Access denied without ethical agreement.');
        window.location.reload();
    });
});

let currentPayloadType = 'text';

function setPayloadType(type) {
    currentPayloadType = type;
    const textBtn = document.getElementById('typeText');
    const fileBtn = document.getElementById('typeFile');
    const textArea = document.getElementById('textPayloadArea');
    const fileArea = document.getElementById('filePayloadArea');

    if (type === 'text') {
        textBtn.classList.add('active');
        fileBtn.classList.remove('active');
        textArea.style.display = 'block';
        fileArea.style.display = 'none';
    } else {
        fileBtn.classList.add('active');
        textBtn.classList.remove('active');
        fileArea.style.display = 'block';
        textArea.style.display = 'none';
    }
}

function displayMessage(message, type) {
    const area = document.getElementById('messageArea');
    area.textContent = message;
    area.className = `message-area ${type}`;
    setTimeout(() => {
        area.className = 'message-area';
    }, 4000);
}

function displayFileName(inputId, displayId) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    if (input.files && input.files[0]) {
        display.textContent = input.files[0].name;
    }
}

// Binary Steganography Logic
async function encodeMessage() {
    const imageInput = document.getElementById('encodeImage');
    const password = document.getElementById('encodePassword').value;
    const errorEl = document.getElementById('encodeError');

    if (!imageInput.files[0]) {
        errorEl.textContent = 'Select a cover image first.';
        return;
    }

    let payloadData;
    let fileName = '';

    if (currentPayloadType === 'text') {
        const text = document.getElementById('message').value;
        if (!text) {
            errorEl.textContent = 'Enter a message to hide.';
            return;
        }
        payloadData = new TextEncoder().encode(text);
    } else {
        const fileInput = document.getElementById('secretFile');
        if (!fileInput.files[0]) {
            errorEl.textContent = 'Select a secret file to hide.';
            return;
        }
        fileName = fileInput.files[0].name;
        payloadData = new Uint8Array(await fileInput.files[0].arrayBuffer());
    }

    // Encryption
    if (password) {
        const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.Uint8Array.create(payloadData), password).toString();
        payloadData = new TextEncoder().encode(encrypted);
    }

    // Header Construction
    const magic = new TextEncoder().encode('STEG');
    const header = new Uint8Array(12 + fileName.length);
    header.set(magic, 0);
    header[4] = 1; // version
    header[5] = password ? 1 : 0;
    header[6] = currentPayloadType === 'text' ? 0 : 1;
    header[7] = fileName.length;
    header.set(new TextEncoder().encode(fileName), 8);

    const size = payloadData.length;
    const sizeDV = new DataView(new ArrayBuffer(4));
    sizeDV.setUint32(0, size);
    header.set(new Uint8Array(sizeDV.buffer), 8 + fileName.length);

    const fullPayload = new Uint8Array(header.length + payloadData.length);
    fullPayload.set(header, 0);
    fullPayload.set(payloadData, header.length);

    // Image Processing
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            if (fullPayload.length * 8 > (data.length / 4) * 3) {
                errorEl.textContent = 'Image too small for this payload.';
                return;
            }

            let bitIndex = 0;
            const bits = [];
            fullPayload.forEach(byte => {
                for (let i = 7; i >= 0; i--) {
                    bits.push((byte >> i) & 1);
                }
            });

            for (let i = 0; i < data.length && bitIndex < bits.length; i++) {
                if (i % 4 === 3) continue; // Skip alpha
                data[i] = (data[i] & 254) | bits[bitIndex++];
            }

            ctx.putImageData(imageData, 0, 0);
            const link = document.createElement('a');
            link.download = 'stego_premium_output.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            displayMessage('Premium Encoding Complete!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(imageInput.files[0]);
}

async function decodeMessage() {
    const imageInput = document.getElementById('decodeImage');
    const password = document.getElementById('decodePassword').value;
    const errorEl = document.getElementById('decodeError');
    const outputEl = document.getElementById('decodedMessage');
    const downloadArea = document.getElementById('fileDownloadArea');

    if (!imageInput.files[0]) {
        errorEl.textContent = 'Select a steganographic image.';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            const bits = [];
            for (let i = 0; i < data.length; i++) {
                if (i % 4 === 3) continue;
                bits.push(data[i] & 1);
            }

            function getBytes(startBit, count) {
                const arr = new Uint8Array(count);
                for (let i = 0; i < count; i++) {
                    let byte = 0;
                    for (let j = 0; j < 8; j++) {
                        byte = (byte << 1) | bits[startBit + (i * 8) + j];
                    }
                    arr[i] = byte;
                }
                return arr;
            }

            // Read Logic
            const magic = new TextDecoder().decode(getBytes(0, 4));
            if (magic !== 'STEG') {
                errorEl.textContent = 'No valid SteganoPro payload found.';
                return;
            }

            const isEncrypted = bits[5 * 8 + 7] === 1;
            const isFile = bits[6 * 8 + 7] === 1;
            const nameLen = getBytes(7 * 8, 1)[0];
            const name = new TextDecoder().decode(getBytes(8 * 8, nameLen));
            const sizeBytes = getBytes((8 + nameLen) * 8, 4);
            const size = new DataView(sizeBytes.buffer).getUint32(0);

            let payload = getBytes((12 + nameLen) * 8, size);

            if (isEncrypted) {
                if (!password) {
                    errorEl.textContent = 'Password required for this payload.';
                    return;
                }
                try {
                    const encryptedStr = new TextDecoder().decode(payload);
                    const decrypted = CryptoJS.AES.decrypt(encryptedStr, password);
                    const decryptedHex = decrypted.toString(CryptoJS.enc.Hex);
                    if (!decryptedHex) throw new Error();

                    const typedArray = new Uint8Array(decryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                    payload = typedArray;
                } catch (err) {
                    errorEl.textContent = 'Invalid password or corrupted data.';
                    return;
                }
            }

            if (isFile) {
                const blob = new Blob([payload], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const link = document.getElementById('downloadPayloadLink');
                link.href = url;
                link.download = name || 'extracted_file';
                outputEl.textContent = `File extracted: ${name}`;
                downloadArea.style.display = 'block';
            } else {
                outputEl.textContent = new TextDecoder().decode(payload);
                downloadArea.style.display = 'none';
            }
            displayMessage('Extraction successful!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(imageInput.files[0]);
}
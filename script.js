(function () {
    let isSessionAgreed = false;
    let currentPayloadType = 'text';

    function displayMessage(message, type) {
        const area = document.getElementById('messageArea');
        if (!area) return;
        area.textContent = message;
        area.className = `message-area ${type}`;
        setTimeout(() => {
            area.className = 'message-area';
        }, 4000);
    }

    function displayFileName(inputId, displayId, removeBtnId) {
        const input = document.getElementById(inputId);
        const display = document.getElementById(displayId);
        const removeBtn = document.getElementById(removeBtnId);
        const container = display ? display.parentElement : null;

        if (input.files && input.files[0]) {
            display.textContent = input.files[0].name;
            if (container) container.style.display = 'inline-flex';
            if (removeBtn) removeBtn.style.display = 'flex';
        } else {
            if (display) display.textContent = '';
            if (container) container.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'none';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const mainContent = document.getElementById('mainContent');
        const ethicsModal = document.getElementById('ethicsModal');
        const agreeButton = document.getElementById('agreeButton');
        const disagreeButton = document.getElementById('disagreeButton');

        // Initially lock the app
        if (mainContent) {
            mainContent.style.pointerEvents = 'none';
            mainContent.style.filter = 'blur(15px)';
            mainContent.style.opacity = '0.3';
        }

        agreeButton.addEventListener('click', function () {
            isSessionAgreed = true;
            ethicsModal.style.display = 'none';
            if (mainContent) {
                mainContent.style.pointerEvents = 'auto';
                mainContent.style.filter = 'none';
                mainContent.style.opacity = '1';
            }
            displayMessage('Agreement signed. Access granted.', 'success');
        });

        disagreeButton.addEventListener('click', function () {
            isSessionAgreed = false;
            displayMessage('Access denied without ethical agreement.', 'error');
            if (ethicsModal) ethicsModal.style.display = 'flex';
            if (mainContent) mainContent.style.pointerEvents = 'none';
        });
    });

    // --- Window Exports (For HTML Handlers) ---

    window.setPayloadType = function (type) {
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
    };

    window.displayMessage = displayMessage;
    window.displayFileName = displayFileName;

    window.clearFile = function (inputId, displayId, removeBtnId) {
        const input = document.getElementById(inputId);
        if (input) input.value = '';
        displayFileName(inputId, displayId, removeBtnId);
    };

    window.encodeMessage = async function () {
        if (!isSessionAgreed) {
            const modal = document.getElementById('ethicsModal');
            if (modal) modal.style.display = 'flex';
            displayMessage('Please agree to the ethical standards first.', 'error');
            return;
        }

        const imageInput = document.getElementById('encodeImage');
        const passwordInput = document.getElementById('encodePassword');
        const password = passwordInput ? passwordInput.value : '';

        if (!imageInput.files[0]) {
            displayMessage('Select a cover image first.', 'error');
            return;
        }

        let payloadData;
        let fileName = '';

        if (currentPayloadType === 'text') {
            const textEl = document.getElementById('message');
            const text = textEl ? textEl.value : '';
            if (!text) {
                displayMessage('Enter a message to hide.', 'error');
                return;
            }
            payloadData = new TextEncoder().encode(text);
        } else {
            const fileInput = document.getElementById('secretFile');
            if (!fileInput.files[0]) {
                displayMessage('Select a secret file to hide.', 'error');
                return;
            }
            fileName = fileInput.files[0].name;
            payloadData = new Uint8Array(await fileInput.files[0].arrayBuffer());
        }

        if (password) {
            const wordWrap = CryptoJS.lib.WordArray.create(payloadData);
            const encrypted = CryptoJS.AES.encrypt(wordWrap, password).toString();
            payloadData = new TextEncoder().encode(encrypted);
        }

        const magic = new TextEncoder().encode('STEG');
        const header = new Uint8Array(12 + fileName.length);
        header.set(magic, 0);
        header[4] = 1;
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

        const reader = new FileReader();
        reader.onload = async function (e) {
            const blob = new Blob([e.target.result]);
            const imgBitmap = await createImageBitmap(blob, {
                colorSpaceConversion: 'none',
                premultiplyAlpha: 'none'
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });
            canvas.width = imgBitmap.width;
            canvas.height = imgBitmap.height;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(imgBitmap, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 3; i < data.length; i += 4) {
                data[i] = 255;
            }

            if (fullPayload.length * 8 > (data.length / 4) * 3) {
                displayMessage('Image too small for this payload.', 'error');
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
                if (i % 4 === 3) continue;
                data[i] = (data[i] & 254) | bits[bitIndex++];
            }

            ctx.putImageData(imageData, 0, 0);
            const link = document.createElement('a');
            link.download = 'stego_premium_output.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            displayMessage('Premium Encoding Complete!', 'success');
        };
        reader.readAsArrayBuffer(imageInput.files[0]);
    };

    window.decodeMessage = async function () {
        if (!isSessionAgreed) {
            const modal = document.getElementById('ethicsModal');
            if (modal) modal.style.display = 'flex';
            displayMessage('Please agree to the ethical standards first.', 'error');
            return;
        }

        const imageInput = document.getElementById('decodeImage');
        const passwordEl = document.getElementById('decodePassword');
        const password = passwordEl ? passwordEl.value : '';
        const outputEl = document.getElementById('decodedMessage');
        const downloadArea = document.getElementById('fileDownloadArea');

        if (!imageInput.files[0]) {
            displayMessage('Select a steganographic image.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function (e) {
            const blob = new Blob([e.target.result]);
            const imgBitmap = await createImageBitmap(blob, {
                colorSpaceConversion: 'none',
                premultiplyAlpha: 'none'
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });
            canvas.width = imgBitmap.width;
            canvas.height = imgBitmap.height;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(imgBitmap, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 3; i < data.length; i += 4) {
                data[i] = 255;
            }

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
                        const idx = startBit + (i * 8) + j;
                        if (idx >= bits.length) return arr;
                        byte = (byte << 1) | bits[idx];
                    }
                    arr[i] = byte;
                }
                return arr;
            }

            const decodedMagic = getBytes(0, 4);
            const magic = new TextDecoder().decode(decodedMagic);
            if (magic !== 'STEG') {
                displayMessage('No valid SteganoPro payload found.', 'error');
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
                    displayMessage('Password required for this payload.', 'error');
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
                    displayMessage('Invalid password or corrupted data.', 'error');
                    return;
                }
            }

            if (isFile) {
                const blob = new Blob([payload], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const link = document.getElementById('downloadPayloadLink');
                if (link) {
                    link.href = url;
                    link.download = name || 'extracted_file';
                }
                if (outputEl) outputEl.textContent = `File extracted: ${name}`;
                if (downloadArea) downloadArea.style.display = 'block';
            } else {
                if (outputEl) outputEl.textContent = new TextDecoder().decode(payload);
                if (downloadArea) downloadArea.style.display = 'none';
            }
            displayMessage('Extraction successful!', 'success');
        };
        reader.readAsArrayBuffer(imageInput.files[0]);
    };
})();
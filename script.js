document.addEventListener('DOMContentLoaded', function() {
    
    // Decoded message placeholder
    const decodedMessageDiv = document.getElementById('decodedMessage');
    const placeholderText = decodedMessageDiv.getAttribute('data-placeholder');
    decodedMessageDiv.textContent = placeholderText;

    // Handling the ethics modal
    const ethicsModal = document.getElementById('ethicsModal');
    const agreeButton = document.getElementById('agreeButton');
    const disagreeButton = document.getElementById('disagreeButton');
    const mainContent = document.getElementById('mainContent');
    const messageArea = document.getElementById('messageArea');

    // If user agrees, enable the main content
    agreeButton.addEventListener('click', function() {
        ethicsModal.style.display = 'none';
        mainContent.style.pointerEvents = 'auto';
        mainContent.style.opacity = '1';
    });

    // If user disagrees, show error message in the modal
    disagreeButton.addEventListener('click', function() {
        displayModalMessage('Sorry, we cannot give access to using this tool without agreement!', 'error');
    });

    // Initially disable the main content
    mainContent.style.pointerEvents = 'none';
    mainContent.style.opacity = '0.5';
});

// Function to display a message in the modal
function displayModalMessage(message, type) {
    const modalContent = document.querySelector('.modal-content');
    let messageDiv = modalContent.querySelector('.modal-message');
    
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.className = `modal-message ${type}`;
        modalContent.appendChild(messageDiv);
    }
    
    messageDiv.textContent = message;
}

// Function to display a message on the page
function displayMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    messageArea.textContent = message;
    messageArea.className = `message-area ${type} show`;
    setTimeout(() => {
        messageArea.className = 'message-area'; // Hide the message after 5 seconds
    }, 5000);
}

// Function to encode a message into an image
function encodeMessage() {
    const imageInput = document.getElementById('encodeImage');
    const message = document.getElementById('message').value;
    const encodeError = document.getElementById('encodeError');

    if (imageInput.files.length === 0) {
        encodeError.textContent = 'Please select an image to encode.';
        return;
    }

    encodeError.textContent = ''; // Clear any previous error messages

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let messageIndex = 0;
            let messageBinary = '';
            for (let i = 0; i < message.length; i++) {
                messageBinary += message.charCodeAt(i).toString(2).padStart(8, '0');
            }
            messageBinary += '00000000'; // Delimiter

            for (let i = 0; i < data.length; i += 4) {
                if (messageIndex < messageBinary.length) {
                    data[i] = (data[i] & 254) | parseInt(messageBinary[messageIndex]);
                    messageIndex++;
                }
            }

            ctx.putImageData(imageData, 0, 0);

            // Downloading the encoded image
            const encodedImageURL = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = encodedImageURL;
            downloadLink.download = 'encoded_image.png';
            downloadLink.click();

            displayMessage('Message encoded successfully!', 'success');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(imageInput.files[0]);
}

// Function to decode a message from an image
function decodeMessage() {
    const imageInput = document.getElementById('decodeImage');
    const decodeError = document.getElementById('decodeError');

    if (imageInput.files.length === 0) {
        decodeError.textContent = 'Please select an image to decode.';
        return;
    }

    decodeError.textContent = ''; // Clear any previous error messages

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let messageBinary = '';
            for (let i = 0; i < data.length; i += 4) {
                messageBinary += (data[i] & 1).toString();
            }

            let message = '';
            for (let i = 0; i < messageBinary.length; i += 8) {
                const byte = messageBinary.slice(i, i + 8);
                if (byte === '00000000') break;
                message += String.fromCharCode(parseInt(byte, 2));
            }

            document.getElementById('decodedMessage').textContent = message;
            displayMessage('Message decoded successfully!', 'success');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(imageInput.files[0]);
}

// Function to display the selected file name
function displayFileName(inputId, fileNameId) {
    const input = document.getElementById(inputId);
    const fileNameDisplay = document.getElementById(fileNameId);

    if (input.files.length > 0) {
        fileNameDisplay.textContent = input.files[0].name;
    } else {
        fileNameDisplay.textContent = '';
    }
}
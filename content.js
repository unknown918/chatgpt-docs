const SITE_URLS = [
    "chat.openai.com",
    "chat-shared2.zhile.io",
    "chat.geekgpt.org",
    "127.0.0.1:8008"
];
const DOC_FILE_EXTS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'];
const url = window.location.href;

let buttonFlickInterval;

function sleep(ms) {
    const start = new Date().getTime();
    while (new Date().getTime() - start < ms) ;
}

function sendText(text) {
    let textarea = document.querySelector("textarea");

    textarea.value = text;

    textarea.style.height = "auto"; // 先将高度设置为自动以重新计算高度
    textarea.style.height = textarea.scrollHeight + "px"; // 设置高度为内容实际高度

    const inputEvent = new InputEvent('input', {
        bubbles: true, cancelable: true, data: ' ',
    });

    let submitButton = document.querySelector(".btn.relative.mr-2.btn-primary");
    if (!submitButton) {
        submitButton = document.querySelector("button.absolute");
    }
    submitButton.disabled = false;

    textarea.focus();
    textarea.dispatchEvent(inputEvent);
    submitButton.click();
}

function readTextFile(file) {
    let reader = new FileReader();
    reader.addEventListener("load", function () {
        let buffer = reader.result;
        let textDecoder = new TextDecoder("utf-8");
        let text = textDecoder.decode(buffer);
        buildToolbar(text);
    });
    reader.readAsArrayBuffer(file);
    // document.body.removeChild(input);
}

function readDocFile(file, ext) {
    const docToText = new DocToText();
    docToText.extractToText(file, ext)
        .then(function (text) {
            buildToolbar(text);
        }).catch(function (error) {
        alert(error);
    });
}

function readFile(file) {
    const {name} = file;
    const ext = name.toLowerCase().substring(name.lastIndexOf('.') + 1);
    if (DOC_FILE_EXTS.indexOf(ext) >= 0) {
        readDocFile(file, ext);
    } else {
        readTextFile(file);
    }
}

function buildToolbar(text) {
    const chunkSize = 2048; // 4095 for ChatGPT-4;
    let textChunks = [];

    for (let i = 0; i < text.length; i += chunkSize) {
        textChunks.push(text.slice(i, i + chunkSize));
    }

    let popup = document.createElement("div");
    popup.className = 'buttons-container'

    for (let i = 0; i < textChunks.length; i++) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'chuck-select'
        checkbox.value = i + '';

        let chunkButton = document.createElement("button");
        const label = `@${i + 1}:`;
        chunkButton.textContent = label;
        chunkButton.className = 'chuck-button'

        const checkboxButton = document.createElement('div');
        checkboxButton.classList.add('checkbox-container');
        checkboxButton.appendChild(chunkButton);
        checkboxButton.appendChild(checkbox);

        const btn_popup = document.createElement('div');
        btn_popup.className = 'btn-popup';
        btn_popup.innerHTML = `<h2>${label}</h2><p><pre>${textChunks[i]}</pre></p>`;


        chunkButton.addEventListener('mouseover', (event) => {
            btn_popup.style.display = 'block';
            const mouseX = event.clientX;
            const mouseY = event.clientY;
            btn_popup.style.top = `${mouseY - btn_popup.offsetHeight}px`;
            btn_popup.style.left = `${mouseX - btn_popup.offsetWidth - 10}px`;
        });

        chunkButton.addEventListener('mouseout', (event) => {
            setTimeout(() => {
                const mouseX = event.clientX;
                const mouseY = event.clientY;
                const rect = btn_popup.getBoundingClientRect();
                const isInBtnPopup =
                    mouseX >= rect.left && mouseX <= rect.right &&
                    mouseY >= rect.top && mouseY <= rect.bottom;

                if (!isInBtnPopup) {
                    btn_popup.style.display = 'none';
                }
            }, 200)
        });

        btn_popup.addEventListener('mouseleave', (event) => {
            btn_popup.style.display = 'none';
        })

        chunkButton.addEventListener("click", function () {
            sendText('this is section ' + label + '\n\n' + textChunks[i] + '\n\n Remember DO NOT answer immediately, do not explain, analyze, summary or rewrite this section!！');
        });

        document.body.appendChild(btn_popup);

        popup.appendChild(checkboxButton);

    }


    let submitButton = document.createElement("button");
    submitButton.textContent = "发送";
    submitButton.className = 'submit-button'
    submitButton.addEventListener("click", () => {
        const checkboxes = document.querySelectorAll('.chuck-select');
        checkboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                const label = checkbox.value
                sendText('this is section ' + label + '\n\n' + textChunks[parseInt(label)] + '\n\n Remember DO NOT answer immediately, do not explain, analyze, summary or rewrite this section!！');
                sleep(1000 * 20)
            }
        });
    });

    let closeButton = document.createElement("button");
    closeButton.textContent = "结束";
    closeButton.className = 'close-button'
    closeButton.addEventListener("click", function () {
        // document.body.removeChild(popup);
        location.reload();
    });

    document.body.appendChild(popup);
    document.body.appendChild(submitButton);
    document.body.appendChild(closeButton);

    clearInterval(buttonFlickInterval);
}

if (SITE_URLS.filter(s => url.indexOf(s) >= 0).length > 0) {

    let newButton = document.createElement("button");

    let icon = document.createTextNode("📂");
    newButton.appendChild(icon);

    newButton.classList.add("download-button");
    newButton.title = "打开文件";
    newButton.className = 'new-button'

    newButton.addEventListener("click", function () {
        let input = document.createElement("input");
        input.type = "file";
        input.style.display = "none";
        document.body.appendChild(input);
        input.click();
        buttonFlickInterval = setInterval(function () {
            newButton.style.opacity = newButton.style.opacity === "0.5" ? "1" : "0.5";
        }, 500);
        input.addEventListener("change", function () {
            const prompt = 'Answer the questions as follows:\n' +
                '1. I will provide you with the content in sections, and each section of text starts with tag "@1","@2",..., please remember all these tags.\n' +
                '2. I will give you question and answer requirements after sending all the sections.\n' +
                '3. Before you accept my question, DO NOT answer, and DO NOT output any summary or information!\n' +
                '4. Respond to my question confidently, accurately, and concisely, based on the sections and requirements. do not play yourself \n' +
                '5. You must talk in CHINESE during the whole conversation! \n\n' +
                '明白了吗？';
            sendText(prompt);
            let file = input.files[0];
            readFile(file);
        });
    });

    document.body.appendChild(newButton);
}

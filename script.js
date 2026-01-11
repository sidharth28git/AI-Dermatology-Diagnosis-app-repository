// ---------------------------
// GLOBAL VARIABLE
// ---------------------------
let currentDisease = null;

// ---------------------------
// PREDICTION LOGIC
// ---------------------------
document.getElementById("predictBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("imageUpload");
    if (!fileInput.files[0]) {
        alert("Please upload an image first.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    document.getElementById("loader").classList.remove("hidden");
    document.getElementById("result").classList.add("hidden");

    try {
        const response = await fetch("http://127.0.0.1:8001/predict", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Backend error");

        const data = await response.json();

        // SET CURRENT DISEASE
        currentDisease = data.class_name;

        // SHOW RESULTS
        document.getElementById("predClass").innerText = data.class_name;
        document.getElementById("predConf").innerText =
            (data.confidence * 100).toFixed(2) + "%";

        const imgPreview = document.getElementById("previewImg");
        imgPreview.src = URL.createObjectURL(fileInput.files[0]);
        imgPreview.classList.remove("hidden");

        document.getElementById("result").classList.remove("hidden");

        // ENABLE CHATBOT
        document.getElementById("chatbotSection").classList.remove("hidden");

    } catch (error) {
        alert("Prediction failed. Check backend logs.");
        console.error(error);
    }

    document.getElementById("loader").classList.add("hidden");
});

// ---------------------------
// DISEASE KNOWLEDGE BASE
// ---------------------------
const DISEASE_INFO = {
    "AKIEC": {
        name: "Actinic Keratoses",
        about: "Precancerous skin lesions caused by UV exposure.",
        symptoms: "Rough, scaly patches that may itch or bleed.",
        precautions: "Avoid sun, use sunscreen, monitor skin changes.",
        doctor: "Dermatologist visit recommended within a week.",
        urgent: "Seek urgent care if lesion grows rapidly or bleeds frequently."
    },
    "BCC": {
        name: "Basal Cell Carcinoma",
        about: "A common skin cancer, slow growing but requires quick medical attention.",
        symptoms: "Shiny bumps, open sores, red patches.",
        precautions: "Avoid sun exposure; use SPF 50+ sunscreen.",
        doctor: "Dermatologist visit recommended ASAP (1–3 days).",
        urgent: "Emergency if severe bleeding or rapid enlargement."
    },
    "BEN_OTH": {
        name: "Benign Lesion",
        about: "Non-cancerous harmless growths.",
        symptoms: "Usually painless and slow-growing.",
        precautions: "Monitor for size or color change.",
        doctor: "Routine checkup suggested.",
        urgent: "Urgent only if painful or rapidly growing."
    },
    "BKL": {
        name: "Benign Keratosis",
        about: "Harmless growths often seen in older adults.",
        symptoms: "Waxy, wart-like spots.",
        precautions: "Avoid scratching.",
        doctor: "Consult if unsure.",
        urgent: "Rarely urgent."
    },
    "DF": {
        name: "Dermatofibroma",
        about: "Benign skin nodule.",
        symptoms: "Firm bumps, usually painless.",
        precautions: "Avoid trauma.",
        doctor: "Optional checkup.",
        urgent: "Urgent only if sudden changes occur."
    },
    "INF": {
        name: "Skin Infection",
        about: "Could be bacterial or fungal.",
        symptoms: "Redness, swelling, warm to touch.",
        precautions: "Keep clean; avoid self-medication.",
        doctor: "Visit doctor within 24–48 hours.",
        urgent: "Urgent if fever or pus is present."
    },
    "MAL_OTH": {
        name: "Other Malignancies",
        about: "Suspicious lesions requiring evaluation.",
        symptoms: "Irregular shape, fast growth.",
        precautions: "Do not delay medical attention.",
        doctor: "Oncologist/Dermatologist within 1–2 days.",
        urgent: "Urgent if bleeding or painful."
    },
    "MEL": {
        name: "Melanoma",
        about: "Serious skin cancer with rapid progression.",
        symptoms: "Asymmetrical moles, color changes.",
        precautions: "Avoid sunlight completely.",
        doctor: "Visit oncologist/dermatologist immediately.",
        urgent: "Emergency if bleeding or sudden changes."
    },
    "NV": {
        name: "Melanocytic Nevus",
        about: "Common moles; typically harmless.",
        symptoms: "Brown/black flat or raised spots.",
        precautions: "Monitor for ABCDE changes.",
        doctor: "Visit dermatologist if changes are noticed.",
        urgent: "Urgent if bleeding or asymmetry."
    },
    "SCCKA": {
        name: "Squamous Cell Carcinoma / Keratoacanthoma",
        about: "Skin cancer that may spread if untreated.",
        symptoms: "Crusted nodules, thick patches.",
        precautions: "Avoid sun; do not pick.",
        doctor: "Dermatologist within 1–3 days.",
        urgent: "Urgent if painful."
    },
    "VASC": {
        name: "Vascular Lesion",
        about: "Growths related to blood vessels.",
        symptoms: "Red or blue lumps.",
        precautions: "Avoid trauma.",
        doctor: "Consult dermatologist.",
        urgent: "Urgent only if heavy bleeding."
    }
};

// ---------------------------
// CHATBOT LOGIC
// ---------------------------
function chatbotReply(disease, message) {
    const info = DISEASE_INFO[disease];
    if (!info) return "I don't have information about this condition.";

    const msg = message.toLowerCase();

    if (msg.includes("what is") || msg.includes("about")) return info.about;
    if (msg.includes("symptom")) return info.symptoms;
    if (msg.includes("precaution")) return info.precautions;
    if (msg.includes("doctor") || msg.includes("visit")) return info.doctor;
    if (msg.includes("urgent") || msg.includes("emergency")) return info.urgent;

    return "You can ask about symptoms, precautions, treatment, or when to see a doctor.";
}

// ---------------------------
// HANDLE CHAT SEND BUTTON
// ---------------------------
document.getElementById("sendBtn").addEventListener("click", () => {
    const userMsg = document.getElementById("userMessage").value.trim();
    if (!userMsg) return;

    if (!currentDisease) {
        alert("Predict a disease first!");
        return;
    }

    const chatWindow = document.getElementById("chatWindow");

    chatWindow.innerHTML += `<div class='user-msg'>${userMsg}</div>`;

    const reply = chatbotReply(currentDisease, userMsg);

    chatWindow.innerHTML += `<div class='bot-msg'>${reply}</div>`;

    chatWindow.scrollTop = chatWindow.scrollHeight;
    document.getElementById("userMessage").value = "";
});
